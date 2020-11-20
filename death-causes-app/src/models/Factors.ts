class Factors {
    bmi: number = 0;
    age: number = 0;
    waist: number = 0;
    caffeine: number = 0; // kop kaffe; svarende til XYZ [mg koffein / dag]. Eventuelt hover over box med typiske koffein indhold i forskellige kaffetyper.
    fish: number = 0; // [g fisk/uge]
    vegetables: number = 0;
    fluids: number = 0;
    headtrauma: number = 0;
    drinking: number = 0;
    gender: string = "Male";
    oralContraceptiveTypicalAmmount: number = 0;
    oralContraceptiveSinceStop: number = 0;
    physicalactivitytotal: number = 0;
    physicalactivityhard: number = 0;
    redmeat: number = 0;
    hcvhistory: boolean = false;
    hivhistory: boolean = false;
    diabetes: boolean = false;
    smokesincestop: number = 0; // afhænger af smokeIntensity. Tidsperiode i år.
    smoketypicalammount: number = 0; // [smøger / dag] mens man røg
    smokeintensity: number = 0; // nuværende forbrug af røg [smøger/dag]
    smokecumulative: number = 0; // pack years. 1 pakke per dag i et år = 1 pack year. eventuelt erstart med smokeStart. 
    indoortanning: number = 0;
    race: string = "White";
    maxdrinking: number = 0;
    greens: number = 0;
    familyhistoryparkinson: boolean = false;
    pesticideexposuredays: number = 0;
    depression: boolean = false;

    // constructor() {
    //     this.bmi = 22;
    //     this.age = 45;

    // }

}

export default Factors;