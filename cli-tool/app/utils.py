import os
import subprocess
from pathlib import Path

import toml
import yaml
from rich.console import Console

console = Console()


# Function to read the TOML config
def read_config(config_path: Path):
    try:
        config = toml.load(config_path)
        return config
    except Exception as e:
        console.print(f"[bold red]Error loading config: {e}[/bold red]")
        raise


def generate_docker_compose(machines, language, directory, file):
    """
    Generates a Docker Compose file based on the selected machines and code type.
    """

    current_file_path = os.path.abspath(__file__)
    absolute_directory_path = os.path.abspath(directory)

    print(absolute_directory_path)

    # Check if the current file and directory exist
    if not os.path.isfile(current_file_path):
        raise FileNotFoundError(f"The file {current_file_path} does not exist.")

    if not os.path.isdir(absolute_directory_path):
        raise NotADirectoryError(
            f"The directory {absolute_directory_path} does not exist."
        )

    scripts_path = current_file_path.split("/")[:-1]
    scripts_path.append("scripts")
    scripts_path = "/".join(scripts_path)

    # Check if the scripts directory exists
    if not os.path.isdir(scripts_path):
        raise NotADirectoryError(
            f"The scripts directory {scripts_path} does not exist."
        )

    services = []
    for machine in machines:
        service = {
            "image": machine["image"],
            "volumes": [
                f"{absolute_directory_path}:/app/{absolute_directory_path}",
                f"{scripts_path}:/app/scripts",
            ],
            "working_dir": "/app",
            "stdin_open": True,
            "tty": True,
        }

        if machine["name"].lower().startswith("ubuntu"):
            script_path = f"{scripts_path}/ubuntu_install.sh"
            if not os.path.isfile(script_path):
                raise FileNotFoundError(f"The script {script_path} does not exist.")
            service["command"] = "bash /app/scripts/ubuntu_install.sh"
        elif machine["name"].lower().startswith("debian"):
            script_path = f"{scripts_path}/debian_install.sh"
            if not os.path.isfile(script_path):
                raise FileNotFoundError(f"The script {script_path} does not exist.")
            service["command"] = "scripts/debian_install.sh"

        services.append((machine["name"], service))

    compose_yaml = {
        "services": {name: service for name, service in services},
    }

    return yaml.dump(compose_yaml, default_flow_style=False)


def run_docker_compose(directory):
    """
    Run Docker Compose command to start the services.
    """

    absolute_directory_path = os.path.abspath(directory)

    result = subprocess.run(
        [
            "docker",
            "compose",
            "-f",
            f"{absolute_directory_path}/tin-docker-compose.yml",
            "up",
            "--build",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode == 0:
        console.print(
            "[bold green]Docker containers started successfully.[/bold green]"
        )
    else:
        console.print(
            f"[bold red]Error running Docker Compose: {result.stderr}[/bold red]"
        )
