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


def run_docker_compose():
    """
    Run Docker Compose command to start the services.
    """
    import subprocess

    result = subprocess.run(
        ["docker", "compose", "-f", "docker-compose.yml", "up", "--build"],
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


def generate_docker_compose(machines, code_type, directory):
    """
    Generates a Docker Compose file based on the selected machines and code type.
    """
    services = []
    for machine in machines:
        service = {
            "image": machine["image"],
            "volumes": [f"../{directory}:/app"],
            "working_dir": "/app",
        }

        if machine["name"].lower().startswith("ubuntu"):
            service["command"] = "scripts/ubuntu_install.sh && "
        elif machine["name"].lower().startswith("debian"):
            service["command"] = "scripts/debian_install.sh && "

        if code_type == "python":
            service["command"] += "python3 /app/main.py"
        elif code_type == "javascript":
            service["command"] += "node /app/main.js"

        services.append((machine["name"], service))

    compose_yaml = {
        "services": {name: service for name, service in services},
    }

    return yaml.dump(compose_yaml, default_flow_style=False)
