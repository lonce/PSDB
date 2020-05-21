import os
import sys
#import librosa
import numpy as np
import soundfile as sf
import scipy
#import scipy.signal
import resampy

fromdir = sys.argv[1]
todir = sys.argv[2]
new_sr = int(sys.argv[3])

if not os.path.exists(todir):
    os.makedirs(todir)
    
# filter out directories and param files (target is any file in sound formats)
files = [f for f in os.listdir(fromdir) if (os.path.isfile(os.path.join(fromdir, f)) and not f.endswith(".params"))]
for filename in files:
    print(os.path.join(fromdir, filename))
    fname=os.path.join(fromdir, filename)
    #y, sr = librosa.load(fname, mono=False)
    y_mono, sr = sf.read(fname)

#
#    y_mono = librosa.to_mono(y)
#
#    if len(y.shape) == 2:
#        if y.shape[1] == 2:
#            wav_data = (y[:, 0] + y[:, 1]) / 2.0


    #y_16k = librosa.resample(y_mono, sr, new_sr)
    #y_16k = scipy.signal.resample_poly(y_mono, sr, new_sr)
    y_16k = resampy.resample(y_mono, sr, new_sr)

    sf.write(os.path.join(todir, filename), y_16k, new_sr)
