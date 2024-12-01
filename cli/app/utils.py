import csv
import os
import subprocess
import time
import webbrowser
from pathlib import Path

import docker
import toml
from colorama import Fore, init
from rich.console import Console
from tabulate import tabulate

console = Console()
client = docker.from_env()


def read_config(config_path: Path):
    """
    Reads configuration from a TOML file.
    """
    try:
        config = toml.load(config_path)
        return config
    except Exception as e:
        console.print(f"[bold red]Error loading config: {e}[/bold red]")
        raise


def collect_stats_to_csv(
    container, output_file, runtime_limit=500, code_execution_time=None
):
    """
    Collects stats from a Docker container and writes them to a CSV file.
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
            system_cpu_usage_ns = stats["cpu_stats"].get("system_cpu_usage", 0)
            cpu_percentage = (
                (cpu_usage_ns / system_cpu_usage_ns) * 100
                if system_cpu_usage_ns > 0
                else 0
            )
            memory_usage_mb = stats["memory_stats"].get("usage", 0) / (1024 * 1024)
            network_stats = stats["networks"]
            network_in = sum(network["rx_bytes"] for network in network_stats.values())
            network_out = sum(network["tx_bytes"] for network in network_stats.values())
            disk_read_mb = stats.get("storage_stats", {}).get("read", 0) / (1024 * 1024)
            disk_write_mb = stats.get("storage_stats", {}).get("write", 0) / (
                1024 * 1024
            )
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


def stop_containers_on_port(port):
    """
    Stops any containers that are using the specified port.
    """
    try:
        containers = client.containers.list(all=True)

        for container in containers:
            container_info = container.attrs
            for port_binding in container_info["NetworkSettings"]["Ports"]:
                if port_binding == f"{port}/tcp":
                    console.print(
                        f"[bold yellow]Stopping container '{container.name}' on port {port}...[/bold yellow]"
                    )
                    container.stop()
                    container.remove()
                    console.print(
                        f"[bold green]Stopped and removed container '{container.name}'.[/bold green]"
                    )
                    break
    except Exception as e:
        console.print(
            f"[bold red]Error stopping containers on port {port}: {e}[/bold red]"
        )


def start_backend():
    """
    Starts the backend with the FastAPI app.
    """
    try:
        subprocess.Popen(
            ["uvicorn", "app.api.main:app", "--reload"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        console.print("[bold green]Started backend locally using uvicorn.[/bold green]")
    except Exception as e:
        console.print(f"[bold red]Error running backend locally: {e}[/bold red]")


def run_ui():
    """
    Runs the UI version of the tool.
    """
    try:
        stop_containers_on_port(8000)
        start_backend()
        time.sleep(5)
        stop_containers_on_port(3000)

        container = client.containers.run(
            "tin-ui",  # Replace with your UI image name
            name="tin-ui",
            ports={"3000/tcp": 3000},
            detach=True,
        )
        console.print(
            f"[bold green]Started UI container '{container.name}' using image 'tin-ui'.[/bold green]"
        )
    except Exception as e:
        console.print(f"[bold red]Error starting UI container: {e}[/bold red]")

    try:
        console.print(
            "[cyan]Opening browser to access the UI at 'http://localhost:3000'...[/cyan]"
        )
        time.sleep(5)
        webbrowser.open("http://localhost:3000")
    except Exception as e:
        console.print(f"[bold red]Error opening browser: {e}[/bold red]")


def run_docker_containers_and_collect_stats(
    machines, language, directory, file, output_file
):
    """
    Runs Docker containers for the specified machines, executes code, and collects stats.
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
    stats = []

    console.print("🔧 [bold blue]Setting up containers...[/bold blue]")
    for machine in machines:
        try:
            command = None

            if machine["name"].startswith("AmazonLinux2"):
                command = "bash /scripts/amazon_install.sh"
            elif machine["name"].startswith("Oracle"):
                command = "bash /scripts/oracle_install.sh"
            else:
                command = "bash /scripts/linux_install.sh"

            container = client.containers.run(
                machine["image"],
                name=machine["name"],
                command=command,
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
            console.print(f"✅ [green]Started container '{container.name}'.[/green]")
        except Exception as e:
            console.print(
                f"❌ [bold red]Error starting container for '{machine['name']}': {e}[/bold red]"
            )

    console.print("⚙️ [bold blue]Executing code in containers...[/bold blue]")
    for container in containers:
        code_execution_time = None
        success = True
        try:
            start_exec_time = time.time()
            if language == "python":
                container.exec_run(f"python3 {file}", stdout=True, stderr=True)
            elif language == "javascript":
                container.exec_run(f"node {file}", stdout=True, stderr=True)
            code_execution_time = time.time() - start_exec_time
            console.print(f"✅ [green]Executed code in '{container.name}'.[/green]")
        except Exception as e:
            console.print(
                f"❌ [bold red]Error executing code in '{container.name}': {e}[/bold red]"
            )
            success = False

        try:
            collect_stats_to_csv(
                container, output_file, code_execution_time=code_execution_time
            )
        except Exception as e:
            console.print(
                f"❌ [bold red]Error collecting stats for '{container.name}': {e}[/bold red]"
            )
            success = False

        stats.append(
            {
                "container": container.name,
                "status": "Success" if success else "Failed",
                "execution_time": code_execution_time if success else None,
                "success": success,
            }
        )

    console.print("🚀 [bold blue]Docker Execution Summary[/bold blue]")
    format_table()

    console.print("🧹 [bold blue]Cleaning up containers...[/bold blue]")
    for container in containers:
        try:
            container.stop()
            container.remove()
            console.print(f"🗑️ [yellow]Stopped and removed '{container.name}'.[/yellow]")
        except Exception as e:
            console.print(
                f"❌ [bold red]Error removing container '{container.name}': {e}[/bold red]"
            )


def format_table():
    """
    Formats and prints a summary table from the collected CSV data.
    """
    init(autoreset=True)
    csv_file = "tin-report.csv"
    rows = []

    with open(csv_file, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    headers = [
        "Timestamp",
        "Container",
        "CPU (%)",
        "Memory (MB)",
        "Network Received (MB)",
        "Network Sent (MB)",
        "Disk Read (MB)",
        "Disk Write (MB)",
        "Runtime (s)",
        "Execution Time (s)",
    ]

    table_data = [
        [
            Fore.WHITE + row["timestamp"],
            Fore.WHITE + row["container_name"],
            Fore.RED
            if float(row["cpu_usage_percentage"]) > 50
            else Fore.GREEN + row["cpu_usage_percentage"],
            Fore.RED
            if float(row["memory_usage_mb"]) > 100
            else Fore.GREEN + row["memory_usage_mb"],
            Fore.CYAN + row["network_received_mb"],
            Fore.CYAN + row["network_sent_mb"],
            Fore.YELLOW + row["disk_read_mb"],
            Fore.YELLOW + row["disk_write_mb"],
            Fore.WHITE + row["runtime_seconds"],
            Fore.WHITE + row["code_execution_time_seconds"],
        ]
        for row in rows
    ]

    print(tabulate(table_data, headers=headers, tablefmt="fancy_grid"))
