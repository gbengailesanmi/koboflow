#!/bin/bash

docker run --name consoldb -e POSTGRES_PASSWORD=Goldbag -d -p 5432:5432 postgres
