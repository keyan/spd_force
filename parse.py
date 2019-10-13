from collections import Counter, defaultdict

from pprint import pprint
import json
import requests


def fetch_data(use_static_data):
    if use_static_data:
        with open('data/full_data.json', 'r') as f:
            return json.load(f)

    url = 'https://data.seattle.gov/resource/ppi5-g2bj.json'
    resp = requests.get(url, params={'$limit': 20000})
    return resp.json()


def remove_duplicates(data):
    incidents = set()
    dedup_data = []
    for item in data:
        if item['uniqueid'] in incidents:
            continue
        dedup_data.append(item)
        incidents.add(item['uniqueid'])
    print(f'Removed {len(data) - len(dedup_data)} duplicate rows')
    print(f'Total incidents: {len(dedup_data)}')
    return dedup_data


def group_by_beat(data):
    counts_by_beat = defaultdict(lambda: Counter())
    for item in data:
        beat = counts_by_beat[item['beat']]
        beat['total'] += 1
        beat[item['subject_race']] += 1
        beat[item['subject_gender']] += 1
        beat[item['incident_type']] += 1

    return counts_by_beat


def add_descriptions_to_geojson(counts_by_beat):
    with open('data/beats.geojson', 'r') as f:
        geojson = json.load(f)

    # Use indices to allow for deletion during iteration of features that had no
    # incidents, these must be some paperwork artifact as they are only nautical
    # regions.
    i = 0
    while i < len(geojson['features']):
        fea = geojson['features'][i]
        beat = fea['properties']['beat']
        counts = counts_by_beat.get(beat, None)
        if counts is None:
            print(f'Beat - {beat} - found in geojson but not in counts dict')
            del geojson['features'][i]
            continue

        for k, v in counts.items():
            fea['properties'][k] = v

        i += 1

    with open('data/annotated_beats.json', 'w') as f:
        json.dump(geojson, f)

    with open('data.js', 'w') as f:
        f.write('var data = ')
        f.write(json.dumps(geojson))


def group_by_officer(data):
    count_by_officer = Counter()
    for item in data:
        count_by_officer[item['officer_id']] += 1

    print(f'Officers involved: {len(count_by_officer)}')

    top10 = (sum([v for (_, v) in count_by_officer.most_common(10)]) / sum(count_by_officer.values())) * 100
    print(f'Top 10 responsible for: {"{0:.3f}".format(top10)}%')
    top100 = (sum([v for (_, v) in count_by_officer.most_common(100)]) / sum(count_by_officer.values())) * 100
    print(f'Top 100 responsible for: {"{0:.3f}".format(top100)}%')
    print('Worst offenders (Officer ID, Incidents):')
    pprint(count_by_officer.most_common(10))

    with open('data/per_officer.csv', 'w') as f:
        f.write('Incidents\n')
        for num in list(count_by_officer.values()):
            f.write(f'{num}\n')


if __name__ == '__main__':
    data = remove_duplicates(fetch_data(True))
    counts_by_beat = group_by_beat(data)
    add_descriptions_to_geojson(counts_by_beat)
    group_by_officer(data)
