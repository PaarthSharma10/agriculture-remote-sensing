"""Test Google Earth Engine connection."""

import ee

ee.Authenticate()

ee.Initialize(project="agriculture-remote-sensing")

message = ee.String("Earth Engine connection successful!")

print(message.getInfo())
