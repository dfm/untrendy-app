#!/usr/bin/env python
# -*- coding: utf-8 -*-

from setuptools import setup

setup(
    name="uta",
    packages=["uta"],
    package_data={"uta": ["templates/*", "static/*"]},
    include_package_data=True,
)
