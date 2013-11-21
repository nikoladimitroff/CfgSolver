function Test(word, isAcceptable) {
	this.word = word;
	this.isAcceptable = isAcceptable;
}

function TestableGrammar(name, rules, tests) {
	this.name = name || "UNTITLED", 
	this.rules = rules || { };
	this.tests = tests || [];
}

var testGrammars = (function generateGrammars() {
	var arithmethicExpressions = new TestableGrammar("Expressions", {
		"S": ["(S)", "E", "N"],
		"E": ["E*E", "E+E", "N"],
		"N": ["NN", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
	}, [
		new Test("(5+4)*23+17", true),
		new Test("1234321123", true),
		new Test("(1234321123)", true),
		new Test("((9876 + 54321)*123)+321", true),
		new Test("((9876 + 54321)*123+321", false),
	]);
	
	var matchingBrackets = new TestableGrammar("Matching Brackets", {
		"S": ["[S]", "{S}", "(S)", "()", "[]", "{}"]		
	}, [
		new Test("(((())))", true),
		new Test("([]{[()]})", true),
		new Test("{[([{([])}])]}", true),
		new Test("{[]()()()()[]}", true),
		new Test("][", false),
		new Test("{[({]})}", false),
	]);
	
	var reverseWord = new TestableGrammar("Palindrome", {
		"S": ["F"],
		"F": []
	}, [
		new Test("abcdefghgfedcba", true),
		new Test("wassamassaw", true),
		new Test("tassessat", true),
		new Test("wasiteliotstoiletisaw", true),
		new Test("notapalindrome", false),
		new Test("obviously", false)		
	]);
	
	for (var i = 0; i < 26; i++) {
		var letter = String.fromCharCode(0x61 + i);
		reverseWord.rules["S"].push(letter + "S" + letter);
		reverseWord.rules["F"].push(letter);
	}
	
	return [
		arithmethicExpressions,
		matchingBrackets,
		reverseWord
	];
	
})();


for (var i = 0; i < testGrammars.length; i++) {
	var grammar = testGrammars[i];
	var transform = CfgSolver.preprocess(grammar.rules);
	test(grammar.name, function () {
		for (var j = 0; j < grammar.tests.length; j++) {
			var test = grammar.tests[j];
			deepEqual(CfgSolver.recognizeWord(transform, test.word), test.isAcceptable);
		}
	});
}