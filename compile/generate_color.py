import math
from scipy.stats import beta

def rgb_to_hex(r,g,b):
    return '#%02x%02x%02x' % (r, g, b)



alphabetmap={a:i for i,a in enumerate(list("abcdefghijklmnopqrstuvwxyz"))}

minVal=140
def to256_space(v):
    return math.floor(make_purer(v)*(256-minVal)+minVal)

def make_purer(x):
    return beta.cdf(x,9,9)

def compute_value_for_one_color(letters):
    vals=[alphabetmap[s.lower()] / (n + 1) for n, s in enumerate(letters) if s.lower() in alphabetmap]
    denominator=[len(alphabetmap) / (n + 1) for n, s in enumerate(letters) if s.lower() in alphabetmap]
    return to256_space(sum(vals)/max(1,sum(denominator)))

def make_hex_color(node):

    red_letters= node[::3]
    green_letters= node[1::3]
    blue_letters= node[2::3]
    r=compute_value_for_one_color(red_letters)
    g=compute_value_for_one_color(green_letters)
    b=compute_value_for_one_color(blue_letters)

    return rgb_to_hex(r,g,b)

if __name__=='__main__':
    words=["Svend","Xylophon","Abekat","Mellemmand","Sahara"]
    print(alphabetmap)
    for w in words:
        print(w, '\t', make_hex_color(w))