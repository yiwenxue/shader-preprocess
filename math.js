const fs = require('fs');
const { grammarFromScriptElement } = require('ohm-js');
const ohm = require('ohm-js');

const source = String.raw`
  Arithmetic {
    Exp
      = AddExp
    AddExp
      = AddExp "+" MulExp  -- plus
      | AddExp "-" MulExp  -- minus
      | MulExp
    MulExp
      = MulExp "*" ExpExp  -- times
      | MulExp "/" ExpExp  -- divide
      | ExpExp
    ExpExp
      = PriExp "^" ExpExp  -- power
      | PriExp
    PriExp
      = "(" Exp ")"  -- paren
      | "+" PriExp   -- pos
      | "-" PriExp   -- neg
      | ident
      | number

    ident  (an identifier)
      = letter alnum*
    number  (a number)
      = digit* "." digit+  -- fract
      | digit+             -- whole
  }
`;


const g = ohm.grammar(source);

const s = g.createSemantics();

const constants = {pi: Math.PI, e: Math.E};

s.addOperation(
    'interpret',
    {
      Exp(e) {
        return e.interpret();  // Note that operations are accessed as methods on the CST nodes.
      },

      AddExp(e) {
        return e.interpret();
      },
      AddExp_plus(x, _, y) {
        return x.interpret() + y.interpret();
      },
      AddExp_minus(x, _, y) {
        return x.interpret() - y.interpret();
      },

      MulExp(e)               { return e.interpret(); },
      MulExp_times(x, _, y)   { return x.interpret() * y.interpret(); },
      MulExp_divide(x, _, y)  { return x.interpret() / y.interpret(); },
      ExpExp(e)               { return e.interpret(); },
      ExpExp_power(x, _, y)   { return Math.pow(x.interpret(), y.interpret()); },
      PriExp(e)               { return e.interpret(); },
      PriExp_paren(_l, e, _r) { return e.interpret(); },
      PriExp_pos(_, e)        { return e.interpret(); },
      PriExp_neg(_, e)        { return -e.interpret(); },
      ident(_l, _ns) {
        return constants[this.sourceString] || 0;
      },
      number(_) {
        return parseFloat(this.sourceString);
      }
    }
);

const r = g.match('(2+4)*7'); // First, you need a successful `MatchResult`.
const n = s(r);               // Then, you apply the semantics to that match result to get a CST node,
console.log(n.interpret()); // ... on which you can access the functionality provided by the
