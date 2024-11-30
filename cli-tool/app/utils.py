import csv
import os
import time
from pathlib import Path

from tabulate import tabulate
from colorama import Fore, Back, Style, init

import docker
import toml
from rich.console import Console

console = Console()
client = docker.from_env()


# ========== Function to read config ========== #
def read_config(config_path: Path):
    try:
        config = toml.load(config_path)
        return config
    except Exception as e:
        console.print(f"[bold red]Error loading config: {e}[/bold red]")
        raise


# ========== Function to collect stats to CSV ========== #
def collect_stats_to_csv(
    container, output_file, runtime_limit=500, code_execution_time=None
):
    """
    Collects stats from a single container and writes them to a CSV file.
    Stops after the specified runtime_limit (in seconds).
    """
    start_time = time.time()
    write_headers = not os.path.exists(output_file)

    with open(output_file, mode="a", newline="") as file:
        writer = csv.writer(file)
        if write_headers:
            writer.writerow(
                [
                    "timestamp",
                    "container_name",
                    "cpu_usage_percentage",
                    "memory_usage_mb",
                    "network_received_mb",
                    "network_sent_mb",
                    "disk_read_mb",
                    "disk_write_mb",
                    "runtime_seconds",
                    "code_execution_time_seconds",
                ]
            )

        while True:
            stats = container.stats(stream=False)
            cpu_usage_ns = stats["cpu_stats"]["cpu_usage"]["total_usage"]
            system_cpu_usage_ns = stats["cpu_stats"]["system_cpu_usage"]
            cpu_percentage = 0

            if system_cpu_usage_ns > 0:
                cpu_percentage = (cpu_usage_ns / system_cpu_usage_ns) * 100

            memory_usage_bytes = stats["memory_stats"]["usage"]
            memory_usage_mb = memory_usage_bytes / (1024 * 1024)

            network_stats = stats["networks"]
            network_in = 0
            network_out = 0
            for network in network_stats.values():
                network_in += network["rx_bytes"]
                network_out += network["tx_bytes"]

            disk_read_mb = 0
            disk_write_mb = 0
            if "storage_stats" in stats:
                disk_read = stats["storage_stats"].get("read", 0)
                disk_write = stats["storage_stats"].get("write", 0)
                disk_read_mb = disk_read / (1024 * 1024)
                disk_write_mb = disk_write / (1024 * 1024)

            runtime_seconds = time.time() - start_time

            timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
            writer.writerow(
                [
                    timestamp,
                    container.name,
                    round(cpu_percentage, 2),
                    round(memory_usage_mb, 2),
                    round(network_in / (1024 * 1024), 2),
                    round(network_out / (1024 * 1024), 2),
                    round(disk_read_mb, 2),
                    round(disk_write_mb, 2),
                    round(runtime_seconds, 2),
                    round(code_execution_time, 2) if code_execution_time else None,
                ]
            )
            file.flush()

            if runtime_seconds >= runtime_limit or container.status != "running":
                break

            time.sleep(1)


# ========== Function to run Docker containers and collect stats ========== #
def run_docker_containers_and_collect_stats(
    machines, language, directory, file, output_file
):
    """
    Starts Docker containers based on the selected machines, runs the provided code,
    and collects stats to output to a CSV file.
    """
    absolute_directory_path = os.path.abspath(directory)

    if not os.path.isdir(absolute_directory_path):
        console.print(
            f"[bold red]Error: The directory '{absolute_directory_path}' does not exist.[/bold red]"
        )
        raise NotADirectoryError(
            f"The directory {absolute_directory_path} does not exist."
        )

    containers = []
    for machine in machines:
        try:
            container = client.containers.run(
                machine["image"],
                name=machine["name"],
                command="bash /scripts/linux_install.sh",
                volumes={
                    absolute_directory_path: {"bind": "/app", "mode": "rw"},
                    os.path.join(os.path.dirname(__file__), "scripts"): {
                        "bind": "/scripts",
                        "mode": "rw",
                    },
                },
                working_dir="/app",
                stdin_open=True,
                tty=True,
                detach=True,
            )
            containers.append(container)
            console.print(
                f"[bold green]Started container '{container.name}' using image '{machine['image']}'.[/bold green]"
            )
        except Exception as e:
            console.print(
                f"[bold red]Error starting container for machine '{machine['name']}': {e}[/bold red]"
            )

    for container in containers:
        code_execution_time = None
        try:
            start_exec_time = time.time()
            if language == "python":
                print("Running Python code in container...")
                console.print(
                    f"[cyan]Running Python code in container '{container.name}'...[/cyan]"
                )
                container.exec_run(f"python3 {file}", stdout=True, stderr=True)
                console.print(
                    f"[green]Python code executed in '{container.name}'.[/green]"
                )
            elif language == "javascript":
                console.print(
                    f"[cyan]Running JavaScript code in container '{container.name}'...[/cyan]"
                )
                container.exec_run(f"node {file}", stdout=True, stderr=True)
                console.print(
                    f"[green]JavaScript code executed in '{container.name}'.[/green]"
                )
            code_execution_time = time.time() - start_exec_time
        except Exception as e:
            console.print(
                f"[bold red]Error running command in container '{container.name}': {e}[/bold red]"
            )

        try:
            console.print(
                f"[cyan]Collecting stats for container '{container.name}'...[/cyan]"
            )
            collect_stats_to_csv(
                container, output_file, code_execution_time=code_execution_time
            )
            console.print(
                f"[green]Stats collected successfully for '{container.name}'.[/green]"
            )
        except Exception as e:
            console.print(
                f"[bold red]Error collecting stats for container '{container.name}': {e}[/bold red]"
            )
            
    format_table()

    # Stop containers after use
    for container in containers:
        try:
            container.stop()
            container.remove()
            console.print(
                f"[bold yellow]Stopped and removed container '{container.name}'.[/bold yellow]"
            )
        except Exception as e:
            console.print(
                f"[bold red]Error stopping/removing container '{container.name}': {e}[/bold red]"
            )


# ========== Function to format table for CLI ========== #
def format_table():

    # Initialize colorama with default values
    init(autoreset=True)

    csv_file = "tin-report.csv"  
    rows = []

    with open(csv_file, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    headers = ["Timestamp", "Container", "CPU (%)", "Memory (MB)", "Network Received (MB)",
            "Network Sent (MB)", "Disk Read (MB)", "Disk Write (MB)", "Runtime (s)", "Execution Time (s)"]

    # Prepare the data to match the headers, adding colors to specific columns
    table_data = []
    for row in rows:
        # Colorize columns based on values (e.g., CPU usage in red if high, memory usage in green if low)
        cpu_color = Fore.RED if float(row["cpu_usage_percentage"]) > 50 else Fore.GREEN
        memory_color = Fore.RED if float(row["memory_usage_mb"]) > 100 else Fore.GREEN
        network_color = Fore.CYAN
        disk_color = Fore.YELLOW
        info_color = Fore.WHITE

        table_data.append([
            info_color + row["timestamp"],  
            info_color + row["container_name"], 
            cpu_color + row["cpu_usage_percentage"], 
            memory_color + row["memory_usage_mb"], 
            network_color + row["network_received_mb"], 
            network_color + row["network_sent_mb"], 
            disk_color + row["disk_read_mb"], 
            disk_color + row["disk_write_mb"], 
            info_color + row["runtime_seconds"], 
            info_color + row["code_execution_time_seconds"] 
        ])

    print(tabulate(table_data, headers=headers, tablefmt="fancy_grid"))

