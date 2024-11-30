from pathlib import Path
from typing import Optional

import toml
import typer
from app.constants import CONFIG_FILE_PATH, MACHINES, OUTPUT_FILE_NAME
from app.utils import read_config, run_docker_containers_and_collect_stats
from rich.console import Console
from typing_extensions import Annotated

console = Console()

app = typer.Typer(
    help="CLI tool for testing code on different Linux machines using Docker."
)


# ========== Command to test code on different machines ========== #
@app.command()
def benchmark(
    directory: Annotated[
        Optional[Path],
        typer.Option("--directory", "-dir", help="Relative path to the code directory"),
    ],
    file: Annotated[
        Optional[str],
        typer.Option("--file", "-f", help="Name of the file that you want to run"),
    ],
    language: Annotated[
        Optional[str],
        typer.Option(
            "--language", "-l", help="Language of the code (python, javascript)"
        ),
    ],
):
    """
    Read config, generate Docker containers, and run the test command on selected machines.
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
        run_docker_containers_and_collect_stats(
            enabled_machines, language, directory, file, OUTPUT_FILE_NAME
        )
        console.print(
            "[bold green]Docker containers executed successfully.[/bold green]"
        )

    except Exception as e:
        console.print(f"[bold red]Error running Docker containers: {e}[/bold red]")


# ========== Command to create the config file ========== #
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
        "machines": MACHINES,
    }

    try:
        with open(CONFIG_FILE_PATH, "w") as f:
            toml.dump(config_data, f)
        console.print(
            f"[bold green]Config file created at: {CONFIG_FILE_PATH}[/bold green]"
        )
    except Exception as e:
        console.print(f"[bold red]Error creating config file: {e}[/bold red]")


# ========== Command to delete the config file ========== #
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
