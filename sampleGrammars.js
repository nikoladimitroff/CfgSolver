function Test(word, isAcceptable) {
	this.word = word;
	this.isAcceptable = isAcceptable;
}

function TestableGrammar(name, description, rules, tests) {
	this.name = name || "UNNAMED", 
	this.description = description || "DESCRIPTION";
	this.rules = rules || { };
	this.tests = tests || [];
	this.transform = CfgSolver.preprocess(rules);
}

function mergeRules(rules1, rules2){
    for (var i in rules2) {
		if (!rules1[i])
			rules1[i] = [];
		rules1[i] = rules1[i].concat(rules2[i]);
	}
	
	return rules1;
}

var testGrammars = (function generateGrammars() {
	var arithmethicExpressions = new TestableGrammar("Expressions", "Generates addition and multiplication (with parentheses) over natural numbers", {
		"E": ["(E)", "EW*WE", "EW+WE", "N"],
		"W": [" ", CfgSolver.epsilon],
		"N": ["NN", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
	}, [
		new Test("(5+4)*23+17", true),
		new Test("1234321123", true),
		new Test("(1234321123)", true),
		new Test("((9876 + 54321)*123)+321", true),
		new Test("((9876 + 54321)*123+321", false),
	]);
	
	var matchingBrackets = new TestableGrammar("Matching Brackets", "Generates all nested matching brackets, square brackets and braces - (), [], {}", {
		"S": ["[S]", "{S}", "(S)", "()", "[]", "{}"]		
	}, [
		new Test("(((())))", true),
		new Test("({[()]})", true),
		new Test("{[([{([])}])]}", true),
		new Test("{{((((((([[[[]]]])))))))}}", true),
		new Test("][", false),
		new Test("{[({]})}", false),
	]);
	
	// Note: Whitespaces are denoted with Y (since nothing else is denoted Y), Z denotes whitespace or empty (WSZ)
	var programmingLanguage = new TestableGrammar("Programming language", 
		"Generates a simple programming language: declaring, initializing and assigning (int, char, bool, string) variables, if conditionals and while loops", {
		"S": ["D;", "E;", "K", "SZS",],
		"Y": [" ", "\t", "\r", "\r\n", "\n", "YY"],
		"Z": ["Y", CfgSolver.epsilon],
		// Declaration is: Type[[]]WHITESPACEname[Assignment];
		"D": ["TAYNH"],
		// H stands for assignment since I'm out of letters #fuckthisgrammarhasbecome2long
		"H": ["Z=ZX",CfgSolver.epsilon],
		"T": ["int", "bool", "char", "string"],
		"A": ["[]", CfgSolver.epsilon],
		"N": ["aN", "bN", "cN", "dN", "eN", "fN", "gN", "hN", "iN", "jN", "kN", "lN", "mN", "nN", "oN", "pN", "qN", "rN", "sN", "tN", "uN", "vN", "wN", "xN", "yN", "zN",
				"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"],
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
		new Test("if((((3<4) &&	!false) || ababababa == baba)){char b = a;}", true),
		new Test("int aa; int a; aa = 0; a = 0;while(a<100){aa = aa + a; a = a + 1;}", true),
		new Test("int aa = 0; int a = 0; while(a<100){aa = aa + a; a = a + 1;}", true),
		new Test("if (a) { while (b) { if (ab) { a = a + b + ab; } } }", true),
		new Test("int aa int a;", false),
		new Test("if (false){ };", false),
		new Test("while(a>=123456;){ char b; }", false),
		new Test("jfcjfjfk", false),
	]);
	
	var palindromeRules = { "S": [], "F": [] };
	for (var i = 0; i < 26; i++) {
		var letter = String.fromCharCode(0x61 + i);
		palindromeRules["S"].push(letter + "S" + letter);
		palindromeRules["F"].push(letter);
	}
	
	var palindromes = new TestableGrammar("Palindrome", "Generates all palindromes", mergeRules(palindromeRules, {
		"S": ["F"],
		"F": []
	}), [
		new Test("abcdefghgfedcba", true),
		new Test("wassamassaw", true),
		new Test("tassessat", true),
		new Test("wasiteliotstoiletisaw", true),
		new Test("notapalindrome", false),
		new Test("obviously", false)		
	]);
	
	
	return [
		programmingLanguage,
		arithmethicExpressions,
		matchingBrackets,
		palindromes,
	];
})();