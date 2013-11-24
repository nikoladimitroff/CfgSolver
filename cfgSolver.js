
/*
var grammar = {
	"E": ["T", "E+T"],
	"T": ['F', 'T*F'],
	'F': ['aI', 'bI', '(E)'],
	'I': ['0I', '1I', EPSILON],
}*/


var CfgSolver = (function () {
	var EPSILON = "ε";
	
	// Create a new object, that prototypally inherits from the Error constructor.
	function CfgError(message) {
	  this.name = "CfgError";
	  this.message = message || "Error solving grammar";
	}
	CfgError.prototype = new Error();
	CfgError.prototype.constructor = CfgError;
	
	// Preprocessed grammar
	function PreprocessedGrammar(grammar, inverseUnitGraph, starting) {
		this.grammar = grammar;
		this.inverseUnitGraph = inverseUnitGraph;
		this.starting = starting;
	}

	var printer = (function () {
		var STR_PAD_LEFT = 1;
		var STR_PAD_RIGHT = 2;
		var STR_PAD_BOTH = 3;
		// Pads string with a given character
		function pad(str, len, pad, dir) {
            len = len || 0;
            pad = pad || ' ';
            dir = dir || STR_PAD_LEFT;

			if (len + 1 >= str.length) {
				switch (dir) {
				    case STR_PAD_LEFT:
						str = Array(len + 1 - str.length).join(pad) + str;
					break;
					case STR_PAD_BOTH:
						var right = Math.ceil((padlen = len - str.length) / 2);
						var left = padlen - right;
						str = Array(left+1).join(pad) + str + Array(right+1).join(pad);
					break;

					default:
						str = str + Array(len + 1 - str.length).join(pad);
					break;
				} // switch
			}
			return str;
		}

		var printGrammar = function printGrammar(grammar) {
			var text = "";
			for	(var nonterminal in grammar) {
				if (grammar[nonterminal] instanceof Function)
					continue;	
				
				text += nonterminal + " -> ";
				for (var rhs in grammar[nonterminal]) {
					text += grammar[nonterminal][rhs] + ", ";
				}
				text += "\r\n";
			}
			console.log(text);	
		};

		var printTable = function printTable(table) {
			var text = "";
			for (var i = 0; i < table.length; i++) {
				for (var j = 0; j < table[i].length	; j++) {
					var element = table[i][j];
					text += "|" + pad(String(element), 10, " ", STR_PAD_LEFT);
				}
				text += "\r\n";
			}
			console.log(text);
		}
		return {
			printGrammar: printGrammar,
			printTable: printTable,
		};
	})();
	
	// Add a contains method to the array prototype
	if (!Array.prototype.contains) {
		Object.defineProperty(Array.prototype, "contains", {
		  enumerable: false,
		  configurable: false,
		  writable: false,
		  value: function (element) {
			return this.indexOf(element) != -1;
		  }
		});
	}

	var preprocessor = (function () {
		
		// A function to increment the current character, smart enough to ignore whitespaces and the EPSILON constant
		var whitespaceRegex = new RegExp("\\s");
		var incrementCharacter = function (character) {
			var asText;
			do
			{
				character++;
				asText = String.fromCharCode(character);
			}
			while (whitespaceRegex.test(asText) || asText == EPSILON);
			
			return character;
		}

		// Finds the character with the highest Unicode index cited in the grammar
		function findLargestCharacter(grammar) {
			var largestLetter = 0;
			for	(var nonterminal in grammar) {
				if (nonterminal.charCodeAt(0) > largestLetter) {
					largestLetter = nonterminal.charCodeAt(0);
				}
				
				for (var index in grammar[nonterminal]) {
					var rhs = grammar[nonterminal][index];
					for (var letter = 0; letter < rhs.length; letter++) {
						if (rhs.charCodeAt(letter) > largestLetter) {
							largestLetter = rhs.charCodeAt(letter);
						}
					}
				}
			}
			return largestLetter;
		}

		// Transforms the given grammar into a binary normal form (2nf)
		var binTransform = function binTransform(grammar) {
			// Find the largest character cited in a grammar rule and increment it by one so that can add new terminals
			var largestLetter = incrementCharacter(findLargestCharacter(grammar));
			var newGrammar = { };
			// Loop trough all rules in the grammar
			for (var nonterminal in grammar) {
				newGrammar[nonterminal] = [];
				for (var rhs in grammar[nonterminal]) {
					var rule = grammar[nonterminal][rhs];
					if (rule.length > 2) {
						// Take the leftmost substring of the word. 
						// While it is longer than 2, remove the rightmost letter, add a new rule that simulates the current with a new nonterminal
						var left = rule;
						var currentNT = nonterminal;
						while (left.length > 2) {
							var newNonterminal = String.fromCharCode(largestLetter);
							largestLetter = incrementCharacter(largestLetter);
							var replacement = left[0] + newNonterminal;
							if (!newGrammar[currentNT]) {
								newGrammar[currentNT] = [];
							}
							newGrammar[currentNT].push(replacement);
							left = left.substr(1);
							currentNT = newNonterminal;
						}
						newGrammar[currentNT] = [left];
					}
					// If the rule has length < 2, all is fine, return
					else {
						newGrammar[nonterminal].push(grammar[nonterminal][rhs]);
					}
				}
			}	
			return newGrammar;
		};

	
		// Computes the set of all nonterminals in the grammars that derive the empty word
		function nullable(grammar) {
			var nullable = [];
			var occurs = { };
			var nonterminals = Object.keys(grammar);
			for (var nonterminal in grammar) {
				occurs[nonterminal] = [];
			}
			
			for	(var nonterminal in grammar) {
				for (var rhs in grammar[nonterminal]) {
					var rhsText = grammar[nonterminal][rhs];
					if (rhsText.length == 1 && grammar[rhsText]) {
						occurs[rhsText].push(nonterminal);
					}
				}
			}
			
			for	(var nonterminal in grammar) {
				for (var rhs in grammar[nonterminal]) {
					var rhsText = grammar[nonterminal][rhs];
					if (rhsText.length == 2 && 
						grammar[rhsText[0]] &&
						grammar[rhsText[1]]) {
							occurs[rhsText[0]].push(nonterminal + rhsText[1]);
							occurs[rhsText[1]].push(nonterminal + rhsText[0]);
					}
				}
			}	
				
			var todo = [];
			var nullable = [];
			for	(var nonterminal in grammar) {
				if (grammar[nonterminal].contains(EPSILON)) {
					nullable.push(nonterminal);
					todo.push(nonterminal);
				}	
			}	
						
			while (todo.length != 0) {
				var B = todo.pop();
				for (var i = 0; i < occurs[B].length; i++) {
					if (occurs[B][i].length == 1)
						continue;
					var A = occurs[B][i][0];
					var C = occurs[B][i][1];
					
					var shouldSkip = 
						!nullable.contains(C) || 
						nullable.contains(A);
						
					if (shouldSkip)
						continue;
					
					nullable.push(A);
					todo.push(A);
				}
			}
			return nullable;
		}

		function constructInverseUnitGraph(grammar) {
			var nullableSet = nullable(grammar);
			var nonterminals = Object.keys(grammar);
			
			var graph = { };
			var addEdge = function addEdge(left, right) {
				if (!graph[left]) {
					graph[left] = [];
				}
				graph[left].push(right);
			}
			
			for (var nonterminal in grammar) {
				for (var rhs in grammar[nonterminal]) {
					var word = grammar[nonterminal][rhs];
					if (word.length == 1) {
						addEdge(word, nonterminal);
					}
					else {
						if (nullableSet.contains(word[0])) {
							addEdge(word[1], nonterminal);
						}
						if (nullableSet.contains(word[1])) {
							addEdge(word[0], nonterminal);
						}
					}
				}
			}
			return graph;
		}
		
		return {
			transform: function (grammar) {
				var starting = Object.keys(grammar)[0],
					transformed = binTransform(grammar),
					inverseUnitGraph = constructInverseUnitGraph(transformed);
					
				if (inverseUnitGraph[EPSILON] && inverseUnitGraph[EPSILON].contains(starting)) {
					throw new CfgError("The empty word may not be derived from the start symbol!");
				}
				return new PreprocessedGrammar(transformed, inverseUnitGraph, starting);
			},
		}
	})();
	
	var recognizer = (function () {
		// The most usual dfs implementation you will ever see
		function dfs(graph, root) {
			if (!graph[root]) {
				return [root];
			}

			var visited = [root];
			var todo = [];
			for (var i = 0; i < graph[root].length; i++) {
				todo.push(graph[root][i]);
				visited.push(graph[root][i]);
			}
			while (todo.length != 0) {
				var next = todo.pop();
				if (graph[next]) {
					for (var edge in graph[next]) {
						var vertex = graph[next][edge];
						if (!visited.contains(vertex)) {
							todo.push(vertex);
							visited.push(vertex);
						}
					}
				}
			}
			return visited;
		}
		// Computes the set of all vertices reachable from the given set of vertices in the given graph
		function solveReachabilityInGraph(graph, set) {
			// Go for a DFS, change the data structure to switch to BFS
			var reachable = [];
			for (var node in set) {
				var visited = dfs(graph, set[node]);
				for (var i = 0; i < visited.length; i++) {
					if (!reachable.contains(visited[i])) { 
						reachable.push(visited[i]);
					}
				}
			}
			return reachable;
		}

		// Tries to accept the given word in the specified grammar, given its inverse unit graph and start symbol
		// Direct implementation as given in the paper by Lange and Leiss
		function tryAcceptWord(grammar, graph, startSymbol, word) {
			if (word.length == 0) {
				
			}
		
			table = [];
			tablePrime = [];
			
			for (var i = 0; i < word.length; i++) {
				table[i] = [];
				tablePrime[i] = [];
				for (var j = 0; j < word.length; j++) {
					table[i][j] = [];
					tablePrime[i][j] = [];
				}
			}
			
			for (var i = 0 ; i < word.length; i++) {
				table[i][i] = solveReachabilityInGraph(graph, [word[i]]);
			}
			
			for (var j = 1; j < word.length; j++) {
				for (var i = j - 1; i >= 0; --i) { 
					tablePrime[i][j] = [];
					for (var h = i; h < j; h++) {
						for (var nonterminal in grammar) {
							for (var rhs in grammar[nonterminal]) {
								var rule = grammar[nonterminal][rhs];
								var condition = 
									rule.length == 2 && 
									table[i][h].contains(rule[0]) &&
									table[h + 1][j].contains(rule[1]);
									
								if (condition) {
									tablePrime[i][j].push(nonterminal);
								}
							}
						}
					}
					table[i][j] = solveReachabilityInGraph(graph, tablePrime[i][j]);
				}
			}
			return table[0][word.length - 1].contains(startSymbol);
		}
		
		return {
			recognizeWord: function (pretransformedGrammar, word) {
				if (!(pretransformedGrammar instanceof PreprocessedGrammar))
					throw new CfgError("Argument pretransformedGrammar must be a grammar generated by CfgSolver.preprocess");
				if (!(word instanceof String))
					throw new CfgError("Argument word must be a string");
				if (word.length == 0) 
					throw new CfgError("Word must be nonempty	");	
					
				return tryAcceptWord(pretransformedGrammar.grammar, pretransformedGrammar.inverseUnitGraph, pretransformedGrammar.starting, word);
			},
		};
	})();
	
	return {
		printer: printer,
		preprocess: preprocessor.transform,
		recognizeWord: recognizer.recognizeWord,		
		epsilon: EPSILON,
	}
})();


