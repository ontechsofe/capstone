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
model = load_model('first_model.h5')

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
    global model, sio
    formatted = array(Image.open(BytesIO(b64decode(d))))
    prediction = model.predict(formatted)
    print(prediction)
    sio.emit('send_prediction', { 'prediction': prediction })

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
    except:
        print('Woops saving didn\'t work!')

sio.connect('http://192.168.69.243:5555')
print('You are connected!')
print(f'Your sid is: {sio.sid}')
signal.signal(signal.SIGINT, signal_handler)
