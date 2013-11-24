CfgSolver
=========

Solves the word problem for CFGs using an optimized [CYK algorithm authored by Lange and Leiss](http://www2.tcs.ifi.lmu.de/SeeYK/paper.pdf).

# Usage
Create your grammar as a simple JS object. For example:

```javascript
var grammar = {
	"E": ["(E)", "EW*WE", "EW+WE", "N"],
	"W": [" ", CfgSolver.epsilon],
	"N": ["NN", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
}
```
Use `CfgSolver.epsilon` when you need to denote the empty word.
Browse [sampleGrammars.js](#sampleGrammars.js) for more examples.

Afterwards, call `CfgSolver.preprocess` and you are ready to go:
```javascript
// Preprocess the grammar
var preprocessed = CfgSolver.preprocess(grammar);
// Use the preprocessed grammar to validate strings
var word = "yourtextgoeshere";
var isValid = CfgSolver.recognizeWord(grammar, word);
```

That's it.

# Other notes
* You may not derive the empty word from the start symbol (`CfgSolver.preprocess` will throw an exception if you do) due to performance reasons
* You can print your grammar in a human readable way. Use `CfgSolver.printer.print(grammar)` to do so (`CfgSolver.printer.print(preprocess.grammar)` for printing preprocessed grammars).