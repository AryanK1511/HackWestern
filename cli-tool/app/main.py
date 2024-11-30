from pathlib import Path
from typing import Optional

import toml
import typer
import yaml
from rich.console import Console
from typing_extensions import Annotated

console = Console()

app = typer.Typer(
    help="CLI tool for testing code on different Linux machines using Docker."
)

# Path to the config file (in the user's home directory)
CONFIG_FILE_PATH = Path.home() / ".tin-config.toml"


# Function to read the TOML config
def read_config(config_path: Path):
    try:
        config = toml.load(config_path)
        return config
    except Exception as e:
        console.print(f"[bold red]Error loading config: {e}[/bold red]")
        raise


@app.command()
def test_code(
    config_file: Annotated[
        Path, typer.Argument(..., help="Path to the TOML config file")
    ],
    directory: Annotated[
        Optional[Path],
        typer.Option("--directory", "-dir", help="Relative path to the code directory"),
    ],
):
    """
    Read config, generate Docker Compose file, and run the test command on selected machines.
    """
    # Load config file
    config = read_config(config_file)

    # Get code directory (relative to home directory by default)
    if not directory:
        directory = config.get("code", {}).get("directory", ".")

    # Expand user directory if necessary
    directory = Path(directory).expanduser()

    # Get machine configurations
    machines = config.get("machines", [])
    enabled_machines = [m for m in machines if m.get("enabled", False)]

    if not enabled_machines:
        console.print(
            "[bold red]No machines are enabled in the config file.[/bold red]"
        )
        return

    # Determine code type
    code_type = config.get("code", {}).get("type", "python").lower()

    # Generate the Docker Compose file
    docker_compose_yaml = generate_docker_compose(
        enabled_machines, code_type, directory
    )

    # Write to a temporary file or print it
    docker_compose_file = Path("docker-compose.yml")
    with open(docker_compose_file, "w") as f:
        f.write(docker_compose_yaml)

    console.print(
        f"[bold green]Docker Compose file generated at: {docker_compose_file}[/bold green]"
    )

    # Run Docker Compose (this will execute the test command in the containers)
    run_docker_compose()


def generate_docker_compose(machines, code_type, directory):
    """
    Generates a Docker Compose file based on the selected machines and code type.
    """
    services = []
    for machine in machines:
        service = {
            "image": machine["image"],
            "volumes": [f"{directory}:/app"],
            "working_dir": "/app",
        }

        if code_type == "python":
            service["command"] = "python3 /app/main.py"  # Adjust for Python code
        elif code_type == "javascript":
            service["command"] = "node /app/main.js"  # Adjust for JS code

        services.append((machine["name"], service))

    # Build the docker-compose YAML structure
    compose_yaml = {
        "version": "3",
        "services": {name: service for name, service in services},
    }

    return yaml.dump(compose_yaml, default_flow_style=False)


def run_docker_compose():
    """
    Run Docker Compose command to start the services.
    """
    import subprocess

    result = subprocess.run(
        ["docker-compose", "up", "--build"], capture_output=True, text=True
    )

    if result.returncode == 0:
        console.print(
            "[bold green]Docker containers started successfully.[/bold green]"
        )
    else:
        console.print(
            f"[bold red]Error running Docker Compose: {result.stderr}[/bold red]"
        )


@app.command()
def create_config():
    """
    Create the .tin-config.toml in the user's home directory.
    """
    if CONFIG_FILE_PATH.exists():
        override = typer.confirm(
            "The config file already exists. Do you want to override it?"
        )
        if not override:
            console.print("[bold red]Config file creation canceled.[/bold red]")
            return

    # Default config structure
    config_data = {
        "machines": [
            {
                "image": "ubuntu:20.04",
                "enabled": True,
            },
            {
                "image": "debian:bullseye",
                "enabled": True,
            },
        ],
    }

    try:
        with open(CONFIG_FILE_PATH, "w") as f:
            toml.dump(config_data, f)
        console.print(
            f"[bold green]Config file created at: {CONFIG_FILE_PATH}[/bold green]"
        )
    except Exception as e:
        console.print(f"[bold red]Error creating config file: {e}[/bold red]")


@app.command()
def delete_config():
    """
    Delete the .tin-config.toml if it exists.
    """
    if CONFIG_FILE_PATH.exists():
        CONFIG_FILE_PATH.unlink()
        console.print(
            f"[bold green]Config file deleted: {CONFIG_FILE_PATH}[/bold green]"
        )
    else:
        console.print("[bold red]No config file found to delete.[/bold red]")
        console.print(
            "[bold]Run [blue underline]tin create-config[/blue underline] to create a config file[/bold]"
        )


if __name__ == "__main__":
    app()
