#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import (division, print_function, absolute_import,
                        unicode_literals)

__all__ = ["app"]

import json
import kplr
import flask
import untrendy
import numpy as np


app = flask.Flask(__name__)
app.config.from_object("uta.config")


@app.route("/")
def index():
    return "Untrendy!"


@app.route("/api/planet/<planetid>")
def planet(planetid):
    client = kplr.API()
    planet = client.planet(planetid)
    if planet is None:
        return (json.dumps({"message": "No planet found with id: '{0}'"
                                       .format(planetid)}), 404)
    return json.dumps(planet._values)


@app.route("/api/koi/<koiid>")
def koi(koiid):
    client = kplr.API()
    koi = client.koi(koiid)
    if koi is None:
        return (json.dumps({"message": "No KOI found with id: '{0}'"
                                       .format(koiid)}), 404)
    return json.dumps(koi._values)


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
        if "slc" in d.filename:
            continue

        # Download and load the dataset.
        ds = kplr.Dataset(d.fetch().filename)

        # Mask and parse the data.
        m = ds.sapmask * ds.qualitymask
        mu = np.median(ds.sapflux[m])

        t.append(ds.time[m])
        f.append(ds.sapflux[m] / mu)
        fe.append(ds.sapferr[m] / mu)

    if not len(t):
        return (json.dumps({"message": "No data for star '{0}'"
                                       .format(kepid)}), 404)

    # Concatenate the data.
    t = np.concatenate(t)
    f = np.concatenate(f)
    fe = np.concatenate(fe)

    # Run untrendy.
    untrendy_args = {"fill_times": 0.1}
    model = untrendy.fit_trend(t, f, fe, **untrendy_args)
    factor = model(t)

    # Normalize data.
    uf = f / factor

    result = {"time": t.tolist(), "sapflux": f.tolist(), "flux": uf.tolist(),
              "knots": model.get_knots(), "coeffs": model.get_coeffs(),
              "model": factor}
    return json.dumps(result)
