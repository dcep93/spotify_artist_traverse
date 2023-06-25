import json

import pymongo
import requests


class Vars:
    pass


def main():
    with open("./secrets.json") as fh:
        Vars.secrets = json.load(fh)
    mongo_collection = get_mongo_connection()
    genres = get_genres()
    seed_artists = get_seed_artists(genres)
    all_artists = {}
    receive_artists(seed_artists, all_artists, mongo_collection)


def get_mongo_connection():
    mongo_client = pymongo.MongoClient("mongodb://localhost:27017/")
    mongo_collection = mongo_client["db"]["collection"]
    return mongo_collection


def get_genres():
    resp = requests.get(
        "https://api.spotify.com/v1/recommendations/available-genre-seeds",
        headers={'Authorization': f'Bearer {Vars.access}'},
    )
    return resp.json["genres"]


def get_seed_artists(genres):
    # TODO
    pass


def get_related_artists(data):
    # TODO
    pass


def get_data(artist):
    # TODO
    pass


def receive_artists(_artists, all_artists, mongo_collection):
    artists = [artist for artist in _artists if artist not in all_artists]
    for artist in artists:
        all_artists[artist] = None
    for artist in artists:
        data = get_data(artist)
        save_to_mongodb(data, mongo_collection)
        related_artists = get_related_artists(data)
        receive_artists(related_artists, all_artists, mongo_collection)


def save_to_mongodb(data, mongo_collection):
    entry = clean_artist_union(data["data"]["artist_union"])
    entry["_id"] = entry["id"]
    mongo_collection.insert_one(entry)


def clean_artist_union(artist_union):
    for key in [
            "relatedContent",
            "goods",
            "profile",
            "visuals",
            "sharingInfo",
            "saved",
            "__typename",
    ]:
        del data[key]
    artist_union["discography"] = {
        "topTracks": {
            "items": [{
                "uid": item["uid"],
                "track": clean_track(item["track"])
            } for item in artist_union["discography"]["topTracks"]["items"]]
        }
    }


def clean_track(track):
    del track["artists"]
    track["albumOfTrack"] = {"uri": track["albumOfTrack"]["uri"]}
    return track


if __name__ == "__main__":
    main()
