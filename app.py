# import time
from pyOpenBCI import OpenBCICyton

def print_raw(sample):
    # time.sleep(2)
    print([x * (4500000)/24/(2**23-1) for x in sample.channels_data])

board = OpenBCICyton(port='COM3', daisy=False)

board.start_stream(print_raw)
# print("Hello")

# import numpy as np
# from pylsl import StreamInfo, StreamOutlet
# from pyOpenBCI import OpenBCICyton

# SCALE_FACTOR_EEG = (4500000)/24/(2**23-1) #uV/count
# SCALE_FACTOR_AUX = 0.002 / (2**4)


# print("Creating LSL stream for EEG. \nName: OpenBCIEEG\nID: OpenBCItestEEG\n")

# info_eeg = StreamInfo('OpenBCIEEG', 'EEG', 8, 250, 'float32', 'OpenBCItestEEG')

# print("Creating LSL stream for AUX. \nName: OpenBCIAUX\nID: OpenBCItestEEG\n")

# info_aux = StreamInfo('OpenBCIAUX', 'AUX', 3, 250, 'float32', 'OpenBCItestAUX')

# outlet_eeg = StreamOutlet(info_eeg)
# outlet_aux = StreamOutlet(info_aux)

# def lsl_streamers(sample):
#     outlet_eeg.push_sample(np.array(sample.channels_data)*SCALE_FACTOR_EEG)
#     outlet_aux.push_sample(np.array(sample.aux_data)*SCALE_FACTOR_AUX)
#     print(outlet_eeg.channels_data)

# board = OpenBCICyton(port='COM3', daisy=False)

# board.start_stream(lsl_streamers)
