import questions from "/Questions.json"

export default function parseQuestions(){

    for (var prop in questions) {
        if (Object.prototype.hasOwnProperty.call(questions, prop)) {
            map.set(prop, new Disease(jsonObject[prop]))
        }
    }
}