export const InteractionFunctions = Object.freeze({
    MULTIPLICATIVE: {name: "multiplicative", interaction: (x,y) => {return x*y}}
})

class Interactions{
    static valueOf(str) {
        for(var key in InteractionFunctions) {
            if(InteractionFunctions[key].name === str) {
                return key
            }
        }
        throw Error("Cannot find Interaction Function for: " + str);
    }

    static getInteraction(interactionFunction) {
        return InteractionFunctions[interactionFunction].interaction
    }
}

export {Interactions};