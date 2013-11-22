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
	
	// Note: Whitespaces are denoted with Y (since nothing else is denoted Y), Z denotes whitespace or empty (WSZ)
	var programmingLanguage = new TestableGrammar("Programming language", {
		"S": ["D;", "E;", "K", "SZS",],
		"Y": [" ", "\t", "\r", "\r\n", "\n", "YY"],
		"Z": ["Y", CfgSolver.epsilon],
		// Declaration is: Type[[]]WHITESPACEname;
		"D": ["TAYN"],
		"T": ["int", "bool", "char", "string"],
		"A": ["[]", CfgSolver.epsilon],
		"N": ["aN", "bN", "a", "b"],
		// An assignment expression is: nameWSZ=WSZexpression
		"E": ["NZ=ZX"],
		// An expressions is: (expression), expression operation expression, operand(R) operation operand(R)
		"X": ["R", "(X)", "XZOZX", "RZOZR"],
		// Our operands will either be variables or single-digit numbers for simplicity
		"R": ["N", "G"],
		"G": ["GG", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
		"O": ["+", "*", "/", "-", "^"],
		// Control structures (K) are kinda simple, simply an if or while followed by a control structure body (L)
		"K": ["ifZL", "whileZL"],
		"L": ["(ZCZ)Z{ZSZ}Z"],
		// Conditional is either true, false, variable name (N), or comparisons (M) over expressions (X) 
		"C": ["true", "false", "N", "(C)", "CZ&&ZC", "CZ||ZC", "!C", "XZMZX"],
		"M": ["<", ">", "==", "<=", ">="]
	}, [
		new Test("int a;", true),
		new Test("int abab;" +
				"\nabab		=	3;", true),
		new Test("if(true){char b;}", true),
		new Test("if(!false && true){char b; b=a;}", true),
		new Test("if((((3<4) &&	!false) || ababababa == baba)){char b; b=a;}", true),
		new Test("int aa; int a; aa = 0; a = 0;while(a<100){aa = aa + a; a = a + 1;}", true),
		new Test("if (a) { while (b) { if (ab) { a = a + b + ab; } } }", true),
		new Test("int aa int a;", false),
		new Test("if (false){ };", false),
		new Test("while(a>=123456;){ char b; }", false),
		new Test("jfcjfjfk", false),
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
		reverseWord,
		programmingLanguage
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
/*
test("Fault tests", function () {
	for (var i = 0; i < testGrammars.length; i++) {
		var grammar = testGrammars[i];
		var transform = CfgSolver.preprocess(grammar.rules);
		deepEqual(CfgSolver.recognizeWord(transform, test.word), test.isAcceptable);
	}
});
*/
test("Benchmarks", function () {
	
});