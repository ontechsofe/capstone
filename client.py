from __future__ import absolute_import, division, print_function, unicode_literals

import signal
import sys
import os

from socketio import Client
from base64 import b64decode
from numpy import array
from PIL import Image
from io import BytesIO
from time import time
from pandas import DataFrame

import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model

sio = Client()
data = []
label = []
# THIS IS THE MODEL FOR 
focus_model = load_model('models/concentration/WILD_MODEL.h5')
pee_model = load_model('models/bathroom/bathroom-95VA-16VL.h5')

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
    global focus_model, pee_model, sio
    formatted = array(Image.open(BytesIO(b64decode(d['data']))))
    formatted = array([array([array([y[:-1]/255 for y in x]) for x in formatted])])
    # formatted = array([array([y[:, :-1]/255 for y in x]) for x in ])
    focus_prediction = float(focus_model.predict(formatted)[0][0])
    pee_prediction = float(pee_model.predict(formatted)[0][0])

    # pred = None
    # if prediction < 0.3: pred = 'Relaxed'
    # elif prediction > 0.7: pred = 'Focused'
    # elif prediction < 0.5: pred = 'Mildly Relaxed'
    # else: pred = 'Mildly Focused'

    print(f'FOCUS LEVEL: {focus_prediction}')
    print(f'PEE LEVEL: {pee_prediction}')
    response =  { 
        'focus_prediction': focus_prediction,
        'pee_prediction': pee_prediction
    }
    sio.emit('send_prediction', response)

@sio.on('label')
def store_labelled(d):
    global data, label
    data.append(d['data'])
    label.append(d['label'])
    print(f"Total Data: {len(data)}")
    print(f"LABEL: {d['label']}")

@sio.on('save_data')
def save_data(d):
    global data, label
    try:
        df = DataFrame({ 'data': data, 'label': label })
        df.to_csv(f"data/{int(time())}.csv")
        data = []
        label = []
        print('Data Saved')
    except Exception:
        print('Woops saving didn\'t work!')

ip = f'http://{sys.argv[1]}:5555'
print(ip)
sio.connect(ip)
print('You are connected!')
print(f'Your sid is: {sio.sid}')
signal.signal(signal.SIGINT, signal_handler)
