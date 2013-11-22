// Assuming testGrammars array has already been populated
if (!testGrammars)
	throw new Error("No tests");

var createTestFunction = function (grammar) {
	return function () {
		for (var j = 0; j < grammar.tests.length; j++) {
			var test = grammar.tests[j];
			deepEqual(CfgSolver.recognizeWord(grammar.transform, test.word), test.isAcceptable);
		}
	};
}
for (var i = 0; i < testGrammars.length; i++) {
	var grammar = testGrammars[i];
	test(grammar.name, createTestFunction(grammar));
}