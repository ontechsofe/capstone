from __future__ import absolute_import, division, print_function, unicode_literals

import signal
import sys

if len(sys.argv) != 2:
    print("[USAGE] python client.py <server-ip>")
    sys.exit(0)

from socketio import Client
from base64 import b64decode
from numpy import array
from PIL import Image
from io import BytesIO
from time import time
from pandas import DataFrame
from tensorflow.keras.models import load_model

sio = Client()

labelled_data = {}
pain_times = []
# THIS IS THE MODEL FOR 
focus_model = load_model('models/concentration/WILD_MODEL.h5')
pee_model = load_model('models/bathroom/bathroom-95VA-16VL.h5')
temperature_model = load_model('models/temperature/temperature-97VA-00VL.h5')
stress_model = load_model('models/stress/stress-93VA-26VL.h5')
pain_model = load_model('models/pain/pain-93VA-05VL.h5')
hunger_model = load_model('models/hungry3/hungry-97VA-14VL.h5')

predictions = {
    'name': [],
    'time': [],
    'focus_prediction': [],
    'pee_prediction': [],
    'temperature_prediction': [],
    'stress_prediction': [],
    'pain_prediction': [],
    'hunger_prediction': []
}


def signal_handler(sig, frame):
    global sio
    sio.disconnect()
    print('You have disconnected!')
    sys.exit(0)


@sio.on('disc')
def disconnect(d):
    global sio
    sio.disconnect()


@sio.on('predict')
def predict(d):
    global focus_model, pee_model, temperature_model, stress_model, pain_model, hunger_model, sio, predictions
    formatted = array(Image.open(BytesIO(b64decode(d['data']))))
    formatted = array([array([array([y[:-1] / 255 for y in x]) for x in formatted])])
    # formatted = array([array([y[:, :-1]/255 for y in x]) for x in ])
    focus_prediction = float(focus_model.predict(formatted)[0][0])
    pee_prediction = float(pee_model.predict(formatted)[0][0])
    temperature_prediction = float(temperature_model.predict(formatted)[0][0])
    stress_prediction = float(stress_model.predict(formatted)[0][0])
    pain_prediction = float(pain_model.predict(formatted)[0][0])
    hunger_prediction = float(hunger_model.predict(formatted)[0][0])

    # pred = None
    # if prediction < 0.3: pred = 'Relaxed'
    # elif prediction > 0.7: pred = 'Focused'
    # elif prediction < 0.5: pred = 'Mildly Relaxed'
    # else: pred = 'Mildly Focused'
    print("------------------------------------------------")
    print(f'FOCUS LEVEL: {focus_prediction}')
    print(f'PEE LEVEL: {pee_prediction}')
    print(f'TEMPERATURE LEVEL: {temperature_prediction}')
    print(f'STRESS LEVEL: {stress_prediction}')
    print(f'PAIN LEVEL: {pain_prediction}')
    print(f'HUNGER LEVEL: {hunger_prediction}')
    print("------------------------------------------------")
    response = {
        'focus_prediction': focus_prediction,
        'pee_prediction': pee_prediction,
        'temperature_prediction': temperature_prediction,
        'stress_prediction': stress_prediction,
        'pain_prediction': pain_prediction,
        'hunger_prediction': hunger_prediction
    }

    predictions['name'].append(d['name'])
    predictions['time'].append(int(time()))
    for key, value in response.items():
        predictions[key].append(value)
    print(len(predictions['name']))
    sio.emit('send_prediction', response)


@sio.on('save_predictions')
def save_predictions(d):
    global predictions, pain_times
    try:
        print("Trying to save")
        df = DataFrame(predictions)
        save_path = f"data/predictions/{int(time())}.csv"
        df.to_csv(save_path)
        df_pain = DataFrame({'pain_times': pain_times})
        df_pain.to_csv(f"data/predictions/PAIN_TIME{int(time())}.csv")

        for key in predictions.keys():
            predictions[key] = []
        pain_times = []
        print(f"Saved as {save_path}")
    except Exception:
        print(f"Woops saving predictions didn't work!")


@sio.on('label')
def store_labelled(d):
    global labelled_data
    if (d['label'] not in labelled_data.keys()):
        labelled_data[d['label']] = []
    labelled_data[d['label']].append(d['data'])
    print("------------------------------------------------")
    for label, data in labelled_data.items():
        print(f"Total {label} Data: {len(data)}")
    print("------------------------------------------------")


@sio.on('save_data')
def save_data(d):
    global labelled_data
    for label, data in labelled_data.items():
        try:
            df = DataFrame({
                "data": data,
                "label": [label] * len(data)
            })
            save_path = f"data/{label}{int(time())}.csv"
            df.to_csv(save_path)
            print(f"Saved {label} data as {save_path}")
            labelled_data = {}
        except Exception:
            print(f"Woops saving {label} didn't work!")


@sio.on('receive_pain')
def receive_pain(d):
    global pain_times
    print(f"[RECEIVED] Pain {int(time())}")
    pain_times.append(int(time()))


ip = f'http://{sys.argv[1]}:5555'
print(ip)
sio.connect(ip)
print('You are connected!')
print(f'Your sid is: {sio.sid}')
signal.signal(signal.SIGINT, signal_handler)
