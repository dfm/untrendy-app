#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import (division, print_function, absolute_import,
                        unicode_literals)

__all__ = ["app"]

import json
import flask
import kplr
import untrendy


app = flask.Flask(__name__)
app.config.from_object("uta.config")


@app.route("/")
def index():
    return "Untrendy!"


@app.route("/api/<kepid>")
def api(kepid):
    # Find the star.
    client = kplr.API()
    star = client.star(kepid)
    if star is None:
        return (json.dumps({"message": "No star found with id: '{0}'"
                                       .format(kepid)}), 404)

    # Download the data.
    t, f, fe = [], [], []
    for d in star.data:
        pass

    result = {}
    return json.dumps(result)
