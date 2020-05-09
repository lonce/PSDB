import os
import sys
import librosa
import numpy as np
import soundfile as sf

fromdir = sys.argv[1]
todir = sys.argv[2]
new_sr = int(sys.argv[3])

if not os.path.exists(todir):
    os.makedirs(todir)
    
files = [f for f in os.listdir(fromdir) if os.path.isfile(os.path.join(fromdir, f))]
for filename in files:
    print(os.path.join(fromdir, filename))
    fname=os.path.join(fromdir, filename)
    y, sr = librosa.load(fname, mono=False)
    #print(y.shape)
    y_mono = librosa.to_mono(y)
    #print(y_mono.shape)
    y_16k = librosa.resample(y_mono, sr, new_sr)
    sf.write(os.path.join(todir, filename), y_16k, new_sr)
