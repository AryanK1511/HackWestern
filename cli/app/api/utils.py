import csv
import os
import shutil
import time
from http.client import HTTPException

import docker
from app.constants import MACHINES

UPLOAD_DIRECTORY = "uploads"
client = docker.from_env()


def create_machine_config(machines_list):
    """Filters machine configurations based on the provided list"""
    filtered_machines = [
        machine for machine in MACHINES if machine["name"] in machines_list
    ]
    return filtered_machines


def run_code_in_container(machine_configs, folder_path, language, entryPoint):
    """Run code inside a Docker container based on the machine's image"""

    abs_folder_path = os.path.abspath(folder_path)

    containers = []

    current_dir = os.path.dirname(__file__)
    scripts_path = os.path.abspath(os.path.join(current_dir, "..", "scripts"))

    for machine_config in machine_configs:
        try:
            container = client.containers.run(
                machine_config["image"],
                name=machine_config["name"],
                command="bash /scripts/linux_install.sh",
                volumes={
                    abs_folder_path: {"bind": "/app", "mode": "rw"},
                    scripts_path: {"bind": "/scripts", "mode": "rw"},
                },
                working_dir="/app",
                stdin_open=True,
                tty=True,
                detach=True,
            )
            containers.append(container)
        except Exception as e:
            print(f"Error running container: {str(e)}")
            return str(e)

    for container in containers:
        code_execution_time = None
        try:
            start_exec_time = time.time()
            if language == "python":
                print(f"Running Python code in {container.name}...")
                container.exec_run(f"python3 {entryPoint}", stdout=True, stderr=True)
            elif language == "javascript":
                print(f"Running JavaScript code in {container.name}...")
                container.exec_run(f"node {entryPoint}", stdout=True, stderr=True)
            code_execution_time = time.time() - start_exec_time
        except Exception as e:
            print(f"Error running code in container: {str(e)}")
            return str(e)

        try:
            collect_stats_to_csv(
                container, "tin-report.csv", code_execution_time=code_execution_time
            )
        except Exception as e:
            print(f"Error collecting stats: {str(e)}")
            return str(e)

    for container in containers:
        try:
            container.stop()
            container.remove()
        except Exception as e:
            print(f"Error stopping container: {str(e)}")
            return str(e)


def save_uploaded_file(folder_path: str, file):
    """Saves an uploaded file to the specified folder"""
    try:
        file_location = os.path.join(folder_path, file.filename)
        os.makedirs(os.path.dirname(file_location), exist_ok=True)

        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return file_location

    except Exception as e:
        print(f"Error saving file {file.filename}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to save file {file.filename}: {str(e)}"
        )


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
