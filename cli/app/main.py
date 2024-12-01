from pathlib import Path
from typing import Optional

import toml
import typer
from app.constants import CONFIG_FILE_PATH, MACHINES, OUTPUT_FILE_NAME
from app.utils import (
    read_config,
    run_docker_containers_and_collect_stats,
    run_ui,
)
from rich.console import Console
from typing_extensions import Annotated

console = Console()
app = typer.Typer(
    help="A powerful tool to test your code across multiple machines and gather comprehensive runtime statistics effortlessly ✨"
)


@app.command()
def benchmark(
    directory: Annotated[
        Optional[Path],
        typer.Option("--directory", "-dir", help="Path to the code directory"),
    ],
    file: Annotated[
        Optional[str],
        typer.Option("--file", "-f", help="Name of the file to run"),
    ],
    language: Annotated[
        Optional[str],
        typer.Option("--language", "-l", help="Code language (python, javascript)"),
    ],
):
    """
    Test code in Docker containers on configured machines.
    """
    if not CONFIG_FILE_PATH.exists():
        console.print("[bold red]No config file found.[/bold red]")
        console.print(
            "[bold]Run [blue underline]tin create-config[/blue underline] to create one.[/bold]"
        )
        return

    config = read_config(CONFIG_FILE_PATH)
    directory = Path(directory).expanduser()

    enabled_machines = [
        m for m in config.get("machines", []) if m.get("enabled", False)
    ]

    if not enabled_machines:
        console.print("[bold red]No enabled machines in config.[/bold red]")
        return

    try:
        run_docker_containers_and_collect_stats(
            enabled_machines, language, directory, file, OUTPUT_FILE_NAME
        )
        console.print("\n[bold green]Execution successful.[/bold green]")
    except Exception as e:
        console.print(f"[bold red]Error: {e}[/bold red]")


@app.command()
def studio():
    """
    Launch the UI version of the tool.
    """
    console.print("[bold]Starting the UI...[/bold]")
    run_ui()


@app.command()
def create_config():
    """
    Generate the config file.
    """
    if CONFIG_FILE_PATH.exists():
        if not typer.confirm("A configuration file already exists. Overwrite?"):
            console.print("[bold red]Canceled.[/bold red]")
            return

    config_data = {
        "machines": [
            {"name": m["name"], "image": m["image"], "enabled": m["enabled"]}
            for m in MACHINES
        ]
    }

    try:
        with open(CONFIG_FILE_PATH, "w") as f:
            toml.dump(config_data, f)
        console.print(f"[bold green]Config saved: {CONFIG_FILE_PATH}[/bold green]")
    except Exception as e:
        console.print(f"[bold red]Error: {e}[/bold red]")


@app.command()
def delete_config():
    """
    Remove the config file.
    """
    if CONFIG_FILE_PATH.exists():
        CONFIG_FILE_PATH.unlink()
        console.print(f"[bold green]Deleted: {CONFIG_FILE_PATH}[/bold green]")
    else:
        console.print("[bold red]No config to delete.[/bold red]")
        console.print(
            "[bold]Run [blue underline]tin create-config[/blue underline] to create one.[/bold]"
        )


if __name__ == "__main__":
    app()
