'''
Created on 17/09/2016

@author: Christian & Svend
'''
from data_frame import data_frame
import json

class MyEncoder(json.JSONEncoder):
    def default(self, o):
        return (o.get_FactorNames(),o.listOfRowsInTheDataFrame)

if __name__=="__main__":
    df=data_frame(["Alcohol","Smoke"],30)
    df.addRow(["-14","0-10",0.1])
    df.addRow(["-14","10+",0.3])
    df.addRow(["14+","0-10",0.2])
    df.addRow(["14+","10+",0.4])

    ad=df.getDataframeAsList()
    print MyEncoder().encode(df)
    json.dumps(df, cls=MyEncoder)
    #print json.dumps(ad)

    print json.dumps([df,[df,df, None],[1,2,3,4]], default=lambda df: df.getDataframeAsList())
    print json.dumps([df,[df,df, None],[1,2,3,4]], cls=MyEncoder)