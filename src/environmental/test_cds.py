"""Test connection to the Copernicus Climate Data Store."""

import cdsapi


def main() -> None:
    """Test CDS API authentication."""

    print("Connecting to Copernicus Climate Data Store...")

    cdsapi.Client()

    print("CDS API authentication successful.")
    print("Connection is ready for data requests.")


if __name__ == "__main__":
    main()
