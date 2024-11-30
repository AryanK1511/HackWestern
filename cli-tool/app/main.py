#!/usr/bin/env python3

import typer
from rich.console import Console

console = Console(soft_wrap=True)
err_console = Console(stderr=True, soft_wrap=True)


app = typer.Typer(
    no_args_is_help=True,
    help="CLI tool for HackWestern",
)


@app.command(
    name="test",
    help="Testing this command",
)
def test():
    console.print("[bold yellow]This is a test1[/]")


@app.command(
    name="test2",
    help="Testing this command for the second time",
)
def test2():
    console.print("[bold yellow]This is test2[/]")


if __name__ == "__main__":
    app()
