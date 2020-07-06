import Serializable from './Serializable';

class RiskFactorTable implements Serializable<RiskFactorTable> {
    riskFactorNames: String[] = []
    riskRatioTables!: Object; 
    interactionTables!: Object

    deserialize(input: {riskFactorNames: String[], riskRatioTables: Object, interactionTables: Object}) {
        this.riskFactorNames = input.riskFactorNames;
        this.riskRatioTables = input.riskRatioTables;
        this.riskRatioTables = input.interactionTables;

        return this
    }
}

export default RiskFactorTable 