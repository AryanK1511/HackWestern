import os
from pathlib import Path
from typing import Optional

import toml
import typer
from app.constants import CONFIG_FILE_PATH, DOCKER_COMPOSE_FILE
from app.utils import generate_docker_compose, read_config, run_docker_compose
from rich.console import Console
from typing_extensions import Annotated

console = Console()

app = typer.Typer(
    help="CLI tool for testing code on different Linux machines using Docker."
)


@app.command()
def test_code(
    directory: Annotated[
        Optional[Path],
        typer.Option("--directory", "-dir", help="Relative path to the code directory"),
    ],
    file: Annotated[
        Optional[str],
        typer.Option("--file", "-f", help="Name of the file that you want to run"),
    ],
    language: Annotated[
        Optional[Path],
        typer.Option(
            "--language", "-l", help="Language of the code (python, javascript)"
        ),
    ],
):
    """
    Read config, generate Docker Compose file, and run the test command on selected machines.
    """
    config_file = CONFIG_FILE_PATH
    config = read_config(config_file)

    directory = Path(directory).expanduser()

    machines = config.get("machines", [])
    enabled_machines = [m for m in machines if m.get("enabled", False)]

    if not enabled_machines:
        console.print(
            "[bold red]No machines are enabled in the config file.[/bold red]"
        )
        return

    try:
        docker_compose_yaml = generate_docker_compose(
            enabled_machines, language, directory, file
        )
    except Exception as e:
        console.print(f"[bold red]Error generating Docker Compose file: {e}[/bold red]")
        return

    absolute_directory_path = os.path.abspath(directory)

    docker_compose_file = Path(DOCKER_COMPOSE_FILE)
    try:
        with open(f"{absolute_directory_path}/{docker_compose_file}", "w") as f:
            f.write(docker_compose_yaml)

        console.print(
            f"[bold green]Docker Compose file generated at: {docker_compose_file}[/bold green]"
        )
    except Exception as e:
        console.print(f"[bold red]Error generating Docker Compose file: {e}[/bold red]")
        return

    # Run Docker Compose (this will execute the test command in the containers)
    try:
        run_docker_compose(directory)
        console.print("[bold green]Docker Compose executed successfully.[/bold green]")
    except Exception as e:
        console.print(f"[bold red]Error running Docker Compose: {e}[/bold red]")


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
                "name": "Ubuntu20.04",
                "image": "ubuntu:20.04",
                "enabled": True,
            },
            {
                "name": "Debian11",
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
