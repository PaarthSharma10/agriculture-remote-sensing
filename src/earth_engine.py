import ee

from config import PROJECT_ID


def initialize():
    ee.Initialize(project=PROJECT_ID)
