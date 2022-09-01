const { matches } = require('z');

const person = {name : "John"};

matches (person, person) (
    (x = {name : "John"}, y = {name : "John"}) => console.log("John"),
)