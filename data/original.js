// Quizzes from https://pythonquizs.vercel.app/ (original content)
QuizBank.addQuizzes([
 {
  "id": "quiz1",
  "subject": "python",
  "semester": "Semester 1",
  "title": "POP Quiz 2 – Data Structures & Control Flow",
  "description": "Lists, loops, scope, control structures, and flowcharts in Python.",
  "questions": [
   {
    "question": "Which data structure is ordered and mutable?",
    "options": [
     "Tuple",
     "Set",
     "List",
     "Dictionary"
    ],
    "correctIndex": 2,
    "explanation": "A List is both ordered (maintains insertion order) and mutable (you can change its elements). Tuples are ordered but immutable, sets are unordered, and dictionaries are ordered (Python 3.7+) but their use-case differs.",
    "wrongExplanations": [
     "Tuple is ordered but immutable – you cannot change its elements after creation.",
     "Set is unordered and does not support indexing.",
     "",
     "Dictionary stores key-value pairs. While ordered in Python 3.7+, it's not the typical answer for this question."
    ]
   },
   {
    "question": "L = [2, 1, 3]\nL[1] = 5\nprint(L)",
    "options": [
     "[2, 1, 3]",
     "[2, 5, 3]",
     "[5, 1, 3]",
     "Error"
    ],
    "correctIndex": 1,
    "explanation": "L[1] refers to the element at index 1 (the second element, which is 1). Setting it to 5 changes the list to [2, 5, 3].",
    "wrongExplanations": [
     "This would mean the assignment had no effect, which is incorrect.",
     "",
     "L[1] is index 1 (second element), not index 0 (first element).",
     "Lists are mutable, so assigning to an index is perfectly valid."
    ]
   },
   {
    "question": "What happens when you run L[4] if L = [2, 'a', 4, [1,2]]?",
    "options": [
     "Returns 2",
     "Returns [1,2]",
     "Returns None",
     "Index error"
    ],
    "correctIndex": 3,
    "explanation": "The list has 4 elements (indices 0–3). Accessing index 4 is out of range, causing an IndexError.",
    "wrongExplanations": [
     "L[0] returns 2, not L[4].",
     "L[3] returns [1,2]. Index 4 doesn't exist.",
     "Python doesn't return None for out-of-range indices; it raises an error.",
     ""
    ]
   },
   {
    "question": "What does range(0, 10, 2) generate?",
    "options": [
     "0 to 10",
     "0 to 9",
     "Even numbers from 0 to 8",
     "Odd numbers from 1 to 9"
    ],
    "correctIndex": 2,
    "explanation": "range(0, 10, 2) starts at 0, stops before 10, steps by 2: 0, 2, 4, 6, 8 – all even numbers from 0 to 8.",
    "wrongExplanations": [
     "range() excludes the stop value and uses a step of 2, not 1.",
     "This would be range(0, 10) with step 1.",
     "",
     "Starting at 0 with step 2 gives even numbers, not odd."
    ]
   },
   {
    "question": "What is nesting in programming?",
    "options": [
     "Writing loops only",
     "Writing conditions only",
     "Placing one control structure inside another",
     "Ending loops early"
    ],
    "correctIndex": 2,
    "explanation": "Nesting means placing one control structure (loop, if-statement, etc.) inside another, like a for loop inside an if statement.",
    "wrongExplanations": [
     "Nesting isn't limited to loops alone.",
     "Nesting isn't limited to conditions alone.",
     "",
     "Ending loops early is done with 'break', not nesting."
    ]
   },
   {
    "question": "Python defines scope mainly using:",
    "options": [
     "Curly braces {}",
     "Semicolons",
     "Indentation",
     "Parentheses"
    ],
    "correctIndex": 2,
    "explanation": "Python uses indentation (whitespace) to define code blocks and scope, unlike languages like Java or C that use curly braces.",
    "wrongExplanations": [
     "Curly braces are used in languages like Java/C, not Python.",
     "Semicolons are statement terminators in other languages.",
     "",
     "Parentheses are used for function calls and grouping expressions."
    ]
   },
   {
    "question": "Control structures in programming are used to:",
    "options": [
     "Store data",
     "Control execution flow",
     "Design user interfaces",
     "Compile programs"
    ],
    "correctIndex": 1,
    "explanation": "Control structures (if/else, loops, etc.) determine the order in which statements are executed – they control the flow of execution.",
    "wrongExplanations": [
     "Variables and data structures store data, not control structures.",
     "",
     "UI design uses frameworks/libraries, not control structures directly.",
     "Compilers compile programs; control structures manage execution flow."
    ]
   },
   {
    "question": "Which of the following is a conditional statement in Python?",
    "options": [
     "for",
     "while",
     "if",
     "range"
    ],
    "correctIndex": 2,
    "explanation": "The 'if' statement is Python's conditional statement – it executes code only when a condition is true.",
    "wrongExplanations": [
     "'for' is a loop statement, not a conditional.",
     "'while' is a loop (though it checks a condition, it's classified as a loop).",
     "",
     "'range' is a built-in function that generates number sequences."
    ]
   },
   {
    "question": "In a flowchart, which shape represents a decision?",
    "options": [
     "Rectangle",
     "Oval",
     "Diamond",
     "Parallelogram"
    ],
    "correctIndex": 2,
    "explanation": "In flowcharts, a diamond shape represents a decision point (yes/no or true/false branching).",
    "wrongExplanations": [
     "Rectangles represent processes or actions.",
     "Ovals represent start/end (terminators).",
     "",
     "Parallelograms represent input/output operations."
    ]
   },
   {
    "question": "Which statement correctly adds an item to the end of a list?",
    "options": [
     "L.add(5)",
     "L.append(5)",
     "L.insert()",
     "add(L,5)"
    ],
    "correctIndex": 1,
    "explanation": "The append() method adds an element to the end of a list. It's the standard way to add items in Python.",
    "wrongExplanations": [
     "Lists don't have an add() method (sets do).",
     "",
     "insert() requires two arguments: index and value. Without them it raises an error.",
     "add() is not a built-in function for lists."
    ]
   }
  ]
 },
 {
  "id": "quiz2",
  "subject": "python",
  "semester": "Semester 1",
  "title": "POP L5 Quiz – Functions & Scope",
  "description": "Functions, parameters, return values, scope, and data structures.",
  "questions": [
   {
    "question": "What is a function in programming?",
    "options": [
     "A variable",
     "A reusable block of code",
     "A loop",
     "A condition"
    ],
    "correctIndex": 1,
    "explanation": "A function is a reusable block of code that performs a specific task. You define it once and call it whenever needed.",
    "wrongExplanations": [
     "A variable stores data; a function performs actions.",
     "",
     "A loop repeats code; a function encapsulates it for reuse.",
     "A condition checks true/false; a function is a code block."
    ]
   },
   {
    "question": "Which keyword is used to define a function in Python?",
    "options": [
     "func",
     "define",
     "def",
     "function"
    ],
    "correctIndex": 2,
    "explanation": "'def' is the keyword used in Python to define a function, followed by the function name and parentheses.",
    "wrongExplanations": [
     "'func' is not a Python keyword (used in some other languages).",
     "'define' is not a Python keyword.",
     "",
     "'function' is used in JavaScript, not Python."
    ]
   },
   {
    "question": "What is the purpose of parameters in a function?",
    "options": [
     "Store output",
     "Take input",
     "Print values",
     "Stop execution"
    ],
    "correctIndex": 1,
    "explanation": "Parameters allow a function to receive input values when it's called, making the function flexible and reusable with different data.",
    "wrongExplanations": [
     "Return values store output, not parameters.",
     "",
     "print() displays values; parameters receive them.",
     "Parameters don't stop execution; that's what 'return' or 'break' does."
    ]
   },
   {
    "question": "What does the return statement do?",
    "options": [
     "Prints output",
     "Ends loop",
     "Sends value back",
     "Declares variable"
    ],
    "correctIndex": 2,
    "explanation": "The return statement sends a value back to the caller of the function, allowing the result to be stored or used elsewhere.",
    "wrongExplanations": [
     "print() displays output on screen; return sends it back to the caller.",
     "'break' ends loops, not 'return'.",
     "",
     "Variable declaration uses assignment (=), not return."
    ]
   },
   {
    "question": "What is abstraction?",
    "options": [
     "Breaking problems",
     "Repeating code",
     "Hiding details",
     "Writing loops"
    ],
    "correctIndex": 2,
    "explanation": "Abstraction means hiding complex implementation details and showing only the essential features. Users of a function don't need to know how it works internally.",
    "wrongExplanations": [
     "Breaking problems into parts is decomposition, not abstraction.",
     "Repeating code is the opposite of good practice; functions reduce repetition.",
     "",
     "Writing loops is iteration, not abstraction."
    ]
   },
   {
    "question": "What is decomposition?",
    "options": [
     "Combining functions",
     "Breaking problems into smaller parts",
     "Printing output",
     "Using loops"
    ],
    "correctIndex": 1,
    "explanation": "Decomposition is the process of breaking a complex problem into smaller, more manageable sub-problems that can be solved independently.",
    "wrongExplanations": [
     "Combining functions is composition, not decomposition.",
     "",
     "Printing output is an I/O operation, not a problem-solving technique.",
     "Using loops is iteration; decomposition is about breaking down problems."
    ]
   },
   {
    "question": "Which of the following is correct about:\ndef add(a, b):\n    return a + b",
    "options": [
     "a and b are outputs",
     "add is a variable",
     "a and b are parameters",
     "return prints output"
    ],
    "correctIndex": 2,
    "explanation": "'a' and 'b' are parameters – they are placeholders that receive values when the function is called.",
    "wrongExplanations": [
     "a and b are inputs (parameters), not outputs. The output is what return sends back.",
     "'add' is a function name, not a variable.",
     "",
     "'return' sends the value back to the caller; print() displays output on screen."
    ]
   },
   {
    "question": "What is the output?\ndef test():\n    print(\"Hello\")\n\nresult = test()\nprint(result)",
    "options": [
     "Hello",
     "None",
     "Hello None",
     "Error"
    ],
    "correctIndex": 2,
    "explanation": "test() prints 'Hello', then returns None (no return statement). print(result) prints None. So the output is 'Hello' followed by 'None'.",
    "wrongExplanations": [
     "Only the first print runs, but result is also printed.",
     "Only the second print, but 'Hello' is printed by the function too.",
     "",
     "This is valid Python code; no error occurs."
    ]
   },
   {
    "question": "What is the main difference between print() and return?",
    "options": [
     "No difference",
     "Print returns value",
     "Return displays output",
     "Print displays, return sends value"
    ],
    "correctIndex": 3,
    "explanation": "print() displays output on the screen for the user to see. return sends a value back to the code that called the function, where it can be stored or used.",
    "wrongExplanations": [
     "They are fundamentally different in purpose.",
     "print() displays on screen; it doesn't return a usable value.",
     "return sends a value back; it doesn't display anything.",
     ""
    ]
   },
   {
    "question": "What is a global variable?",
    "options": [
     "Inside function",
     "Outside function",
     "Only in loops",
     "Only in lists"
    ],
    "correctIndex": 1,
    "explanation": "A global variable is defined outside any function, making it accessible from anywhere in the program.",
    "wrongExplanations": [
     "Variables inside functions are local variables.",
     "",
     "Variables can exist anywhere, not just in loops.",
     "Lists are data structures, not scopes for variables."
    ]
   },
   {
    "question": "What is a local variable?",
    "options": [
     "Defined outside function",
     "Defined inside function",
     "Used everywhere",
     "Always global"
    ],
    "correctIndex": 1,
    "explanation": "A local variable is defined inside a function and can only be accessed within that function. It's created when the function runs and destroyed when it ends.",
    "wrongExplanations": [
     "Variables outside functions are global, not local.",
     "",
     "Local variables can only be used inside their function.",
     "Local and global are opposites; local variables are not global."
    ]
   },
   {
    "question": "Which is a list?",
    "options": [
     "(1,2,3)",
     "{1,2,3}",
     "[1,2,3]",
     "\"123\""
    ],
    "correctIndex": 2,
    "explanation": "Lists in Python use square brackets []. (1,2,3) is a tuple, {1,2,3} is a set, and \"123\" is a string.",
    "wrongExplanations": [
     "(1,2,3) creates a tuple, not a list.",
     "{1,2,3} creates a set, not a list.",
     "",
     "\"123\" is a string, not a list."
    ]
   },
   {
    "question": "Which data structure is mutable?",
    "options": [
     "Tuple",
     "String",
     "List",
     "Integer"
    ],
    "correctIndex": 2,
    "explanation": "Lists are mutable – you can add, remove, or change elements after creation. Tuples, strings, and integers are all immutable.",
    "wrongExplanations": [
     "Tuples are immutable; you cannot change their elements.",
     "Strings are immutable; you cannot change individual characters.",
     "",
     "Integers are immutable; operations create new values."
    ]
   }
  ]
 },
 {
  "id": "quiz3",
  "subject": "python",
  "semester": "Semester 1",
  "title": "POL L6 Quiz – Variables, Loops & Functions",
  "description": "Variables, data types, conditions, loops, functions, and modular programming.",
  "questions": [
   {
    "question": "What is a variable in Python?",
    "options": [
     "A fixed value",
     "A container for storing data",
     "A type of loop",
     "An error"
    ],
    "correctIndex": 1,
    "explanation": "A variable is a named container that stores data in memory. Its value can be changed during program execution.",
    "wrongExplanations": [
     "Constants are fixed values; variables can change.",
     "",
     "Loops repeat code; variables store data.",
     "An error is a problem in code; a variable is a data container."
    ]
   },
   {
    "question": "Which of the following is a valid variable name?",
    "options": [
     "1name",
     "name_1",
     "name-1",
     "class"
    ],
    "correctIndex": 1,
    "explanation": "'name_1' is valid – it starts with a letter, uses underscores, and isn't a reserved keyword.",
    "wrongExplanations": [
     "Variable names cannot start with a number.",
     "",
     "Hyphens are not allowed in variable names (Python interprets it as subtraction).",
     "'class' is a reserved keyword in Python and cannot be used as a variable name."
    ]
   },
   {
    "question": "What is the output of print(type(5))?",
    "options": [
     "int",
     "<class 'int'>",
     "integer",
     "number"
    ],
    "correctIndex": 1,
    "explanation": "The type() function returns the type object, and print() displays it as <class 'int'> – the full class representation.",
    "wrongExplanations": [
     "Python shows the full class representation, not just 'int'.",
     "",
     "'integer' is not how Python displays types.",
     "'number' is not a Python type name."
    ]
   },
   {
    "question": "Which data type is used to store text?",
    "options": [
     "int",
     "float",
     "str",
     "bool"
    ],
    "correctIndex": 2,
    "explanation": "'str' (string) is Python's data type for storing text – sequences of characters enclosed in quotes.",
    "wrongExplanations": [
     "'int' stores whole numbers, not text.",
     "'float' stores decimal numbers, not text.",
     "",
     "'bool' stores True/False values, not text."
    ]
   },
   {
    "question": "What does an if statement do?",
    "options": [
     "Repeats code",
     "Checks a condition",
     "Defines a function",
     "Handles errors"
    ],
    "correctIndex": 1,
    "explanation": "An 'if' statement checks whether a condition is true and executes the indented code block only if it is.",
    "wrongExplanations": [
     "Loops (for/while) repeat code, not if statements.",
     "",
     "'def' defines functions, not 'if'.",
     "'try/except' handles errors, not 'if'."
    ]
   },
   {
    "question": "Which loop is used when the number of iterations is known?",
    "options": [
     "while",
     "for",
     "if",
     "try"
    ],
    "correctIndex": 1,
    "explanation": "A 'for' loop is used when you know how many times to iterate (e.g., over a range or collection). 'while' is used when the number of iterations depends on a condition.",
    "wrongExplanations": [
     "'while' loops are for when you don't know the exact number of iterations.",
     "",
     "'if' is a conditional, not a loop.",
     "'try' is for error handling, not looping."
    ]
   },
   {
    "question": "What does a while loop do?",
    "options": [
     "Runs once",
     "Runs forever",
     "Runs while a condition is true",
     "Stops immediately"
    ],
    "correctIndex": 2,
    "explanation": "A while loop keeps executing its code block as long as its condition evaluates to True. It stops when the condition becomes False.",
    "wrongExplanations": [
     "A while loop can run many times, not just once.",
     "It only runs forever if the condition never becomes False (infinite loop).",
     "",
     "It runs repeatedly, not stopping immediately."
    ]
   },
   {
    "question": "What is a function?",
    "options": [
     "A variable",
     "A reusable block of code",
     "A loop",
     "An error"
    ],
    "correctIndex": 1,
    "explanation": "A function is a reusable block of code designed to perform a specific task. You define it with 'def' and call it by name.",
    "wrongExplanations": [
     "Variables store data; functions perform actions.",
     "",
     "Loops repeat code; functions encapsulate code for reuse.",
     "An error indicates a problem; a function is a code structure."
    ]
   },
   {
    "question": "Which keyword is used to define a function?",
    "options": [
     "func",
     "define",
     "def",
     "function"
    ],
    "correctIndex": 2,
    "explanation": "'def' is the Python keyword for defining functions: def function_name(parameters):",
    "wrongExplanations": [
     "'func' is not a Python keyword.",
     "'define' is not a Python keyword.",
     "",
     "'function' is used in JavaScript, not Python."
    ]
   },
   {
    "question": "What does a function return?",
    "options": [
     "Input",
     "Output",
     "Loop",
     "Error"
    ],
    "correctIndex": 1,
    "explanation": "A function processes input and returns output – a result that can be used by the calling code.",
    "wrongExplanations": [
     "Input is what goes into a function (parameters), not what comes out.",
     "",
     "A loop is a control structure, not something a function returns.",
     "Errors are exceptions, not normal function returns."
    ]
   },
   {
    "question": "What happens if a function has no return statement?",
    "options": [
     "Error",
     "Returns 0",
     "Returns None",
     "Stops program"
    ],
    "correctIndex": 2,
    "explanation": "If a function has no return statement, Python automatically returns None – a special value meaning 'nothing'.",
    "wrongExplanations": [
     "No error occurs; it's perfectly valid Python.",
     "It returns None, not 0.",
     "",
     "The program continues normally after the function finishes."
    ]
   },
   {
    "question": "What is modular programming?",
    "options": [
     "Writing long code",
     "Breaking code into smaller parts",
     "Avoiding functions",
     "Using only loops"
    ],
    "correctIndex": 1,
    "explanation": "Modular programming means breaking code into smaller, independent modules (functions/classes) that are easier to develop, test, and maintain.",
    "wrongExplanations": [
     "Modular programming aims to avoid long monolithic code.",
     "",
     "Functions are central to modular programming, not avoided.",
     "Modular programming uses all structures, not just loops."
    ]
   },
   {
    "question": "Why is testing important?",
    "options": [
     "To make code longer",
     "To ensure correct output",
     "To avoid writing code",
     "To slow program"
    ],
    "correctIndex": 1,
    "explanation": "Testing verifies that your code produces the correct output for given inputs, helping catch bugs before deployment.",
    "wrongExplanations": [
     "Testing doesn't make code longer; it verifies correctness.",
     "",
     "Testing complements writing code, it doesn't replace it.",
     "Testing doesn't slow programs; it ensures they work correctly."
    ]
   }
  ]
 },
 {
  "id": "quiz4",
  "subject": "python",
  "semester": "Semester 1",
  "title": "POP Replacement Class Quiz",
  "description": "Python Programming Basics (I/O) and Object-Oriented Programming (OOP) fundamentals.",
  "questions": [
   {
    "question": "What does I/O stand for?",
    "options": [
     "Internal Output",
     "Input and Output",
     "Input Only",
     "Internal Operations"
    ],
    "correctIndex": 1,
    "explanation": "I/O stands for Input/Output, referring to any operation, program, or device that transfers data to or from a computer.",
    "wrongExplanations": [
     "I/O involves more than just internal processes; it's about data exchange with the system.",
     "",
     "I/O includes both entering and displaying data, not just input.",
     "I/O is a standard term for data transfer, not internal operations."
    ]
   },
   {
    "question": "Which of the following is an input device?",
    "options": [
     "Monitor",
     "Printer",
     "Keyboard",
     "Speaker"
    ],
    "correctIndex": 2,
    "explanation": "A keyboard is used to input text and commands into the computer. Monitors, printers, and speakers are output devices.",
    "wrongExplanations": [
     "Monitors display data from the computer, making them output devices.",
     "Printers produce physical copies of digital data, which is an output operation.",
     "",
     "Speakers output sound from the computer."
    ]
   },
   {
    "question": "What is an input stream?",
    "options": [
     "Data flowing out of program",
     "Data flowing into program",
     "Data stored in file",
     "Data deleted from memory"
    ],
    "correctIndex": 1,
    "explanation": "An input stream is a sequence of data flowing into a program from an external source like a keyboard or file.",
    "wrongExplanations": [
     "Data flowing out is an output stream.",
     "",
     "A file can be a source for an input stream, but the stream itself is the flow of data.",
     "Streams are about movement of data, not deletion from memory."
    ]
   },
   {
    "question": "What type of value does input() return by default?",
    "options": [
     "int",
     "float",
     "str",
     "bool"
    ],
    "correctIndex": 2,
    "explanation": "In Python 3, the input() function always returns data as a string (str), even if the user types a number.",
    "wrongExplanations": [
     "Even if you type a whole number, input() returns it as a string. You must convert it manually.",
     "Decimal numbers are returned as strings by input().",
     "",
     "Boolean values are also returned as strings like 'True' or 'False'."
    ]
   },
   {
    "question": "How do you convert input to an integer?",
    "options": [
     "int(input())",
     "input(int)",
     "integer(input())",
     "str(input())"
    ],
    "correctIndex": 0,
    "explanation": "The int() function converts a string or number to an integer. Wrapping input() with int() converts the user input string to an integer.",
    "wrongExplanations": [
     "",
     "input() does not take a type as an argument to perform conversion.",
     "There is no 'integer()' function in Python; the correct function is 'int()'.",
     "str() converts values to strings, which is what input() already returns."
    ]
   },
   {
    "question": "What is the correct way to print multiple values?",
    "options": [
     "print(a + b)",
     "print(a, b)",
     "echo(a, b)",
     "printf(a, b)"
    ],
    "correctIndex": 1,
    "explanation": "The print() function can take multiple arguments separated by commas, and it will print them with a space in between by default.",
    "wrongExplanations": [
     "Using '+' will try to add the values together (or concatenate if both are strings), which is different from printing them as separate items.",
     "",
     "'echo' is used in shell scripting or PHP, not Python.",
     "'printf' is common in C/C++, but Python uses print() (or f-strings)."
    ]
   },
   {
    "question": "What will this print?\nprint(\"Hello\", \"World\")",
    "options": [
     "HelloWorld",
     "Hello World",
     "Hello,World",
     "Error"
    ],
    "correctIndex": 1,
    "explanation": "By default, the print() function inserts a space between multiple arguments.",
    "wrongExplanations": [
     "HelloWorld would be printed if they were concatenated with '+' or if a custom separator was used.",
     "",
     "The comma in the code separates arguments; it doesn't appear in the output unless specified.",
     "This is perfectly valid Python syntax."
    ]
   },
   {
    "question": "Which keyword is used for output in Python?",
    "options": [
     "printf",
     "echo",
     "print",
     "display"
    ],
    "correctIndex": 2,
    "explanation": "'print' is the built-in function used to output data to the standard output device (screen).",
    "wrongExplanations": [
     "printf is not a built-in keyword for output in Python.",
     "echo is not used for output in Python.",
     "",
     "display is not a standard built-in function for terminal output in Python."
    ]
   },
   {
    "question": "Which function is used to take input from the user in Python?",
    "options": [
     "scanf()",
     "input()",
     "read()",
     "get()"
    ],
    "correctIndex": 1,
    "explanation": "'input()' is the standard function for reading a line of text from the user.",
    "wrongExplanations": [
     "scanf is used in C, not Python.",
     "",
     "read() is typically used for file objects, not direct user console input.",
     "get() is often a method for dictionaries or other objects, not a built-in for user input."
    ]
   },
   {
    "question": "What happens if a function has no return statement?",
    "options": [
     "Returns 0",
     "Returns None",
     "Error",
     "Returns empty string"
    ],
    "correctIndex": 1,
    "explanation": "In Python, if a function reaches the end without a return statement, it implicitly returns the special value 'None'.",
    "wrongExplanations": [
     "Python returns None, not the integer 0.",
     "",
     "It is not an error to omit a return statement.",
     "It returns None, not an empty string."
    ]
   },
   {
    "question": "What is a parameter?",
    "options": [
     "Value passed to function",
     "Variable inside function definition",
     "Output of function",
     "Error"
    ],
    "correctIndex": 1,
    "explanation": "Parameters are variables listed in the function definition. Arguments are the actual values passed to the function when it is called.",
    "wrongExplanations": [
     "The value passed is called an 'argument'.",
     "",
     "The output of a function is the return value.",
     "A parameter is a normal part of function definition, not an error."
    ]
   },
   {
    "question": "What is a class?",
    "options": [
     "A blueprint for creating objects",
     "A single instance of data",
     "A function in Python",
     "A variable inside a function"
    ],
    "correctIndex": 0,
    "explanation": "A class is a template or blueprint that defines the attributes (data) and methods (behavior) that objects created from it will have.",
    "wrongExplanations": [
     "",
     "A single instance of data is an 'object', not a class.",
     "While classes contain functions (methods), a class itself is a broader structure.",
     "A variable inside a function is a local variable."
    ]
   },
   {
    "question": "What is an object?",
    "options": [
     "A blueprint for classes",
     "An instance of a class",
     "A function definition",
     "A data type in Python"
    ],
    "correctIndex": 1,
    "explanation": "An object is a specific realization of a class. It has its own unique data but follows the structure defined by its class.",
    "wrongExplanations": [
     "Classes are blueprints for objects, not the other way around.",
     "",
     "A function definition is a 'method' or 'function', not an object.",
     "While an object has a data type (its class), 'object' itself refers to the instance."
    ]
   },
   {
    "question": "Why do we use 'self'?",
    "options": [
     "To refer to the current instance of the class",
     "To define global variables",
     "To call static methods",
     "To import modules"
    ],
    "correctIndex": 0,
    "explanation": "'self' is the first parameter of instance methods in Python. It represents the specific object being operated on.",
    "wrongExplanations": [
     "",
     "'self' is for instance-level data, not global variables.",
     "Static methods do not use 'self'.",
     "Modules are imported using 'import'."
    ]
   },
   {
    "question": "Name one pillar of OOP.",
    "options": [
     "Polymorphism",
     "Compilation",
     "Debugging",
     "Interpretation"
    ],
    "correctIndex": 0,
    "explanation": "The four pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism.",
    "wrongExplanations": [
     "",
     "Compilation is a process of converting source code to machine code, not an OOP pillar.",
     "Debugging is the process of finding and fixing errors.",
     "Interpretation is the process of executing code line-by-line."
    ]
   }
  ]
 },
 {
  "id": "quiz5",
  "subject": "python",
  "semester": "Semester 1",
  "title": "Comprehensive Review Quiz",
  "description": "A mixed quiz featuring random questions from previous sessions and core OOP concepts.",
  "questions": [
   {
    "question": "Which data structure is ordered and mutable?",
    "options": [
     "Tuple",
     "Set",
     "List",
     "Dictionary"
    ],
    "correctIndex": 2,
    "explanation": "A List is both ordered (maintains insertion order) and mutable (you can change its elements).",
    "wrongExplanations": [
     "Tuple is ordered but immutable.",
     "Set is unordered.",
     "",
     "Dictionary is for key-value pairs."
    ]
   },
   {
    "question": "What happens when you run L[4] if L = [2, 'a', 4, [1,2]]?",
    "options": [
     "Returns 2",
     "Returns [1,2]",
     "Returns None",
     "Index error"
    ],
    "correctIndex": 3,
    "explanation": "The list has 4 elements (indices 0–3). Accessing index 4 is out of range.",
    "wrongExplanations": [
     "L[0] returns 2.",
     "L[3] returns [1,2].",
     "Python raises an error for out-of-range indices.",
     ""
    ]
   },
   {
    "question": "Python defines scope mainly using:",
    "options": [
     "Curly braces {}",
     "Semicolons",
     "Indentation",
     "Parentheses"
    ],
    "correctIndex": 2,
    "explanation": "Python uses indentation (whitespace) to define code blocks and scope.",
    "wrongExplanations": [
     "Curly braces are used in Java/C.",
     "Semicolons are not used for scope in Python.",
     "",
     "Parentheses are for calls and grouping."
    ]
   },
   {
    "question": "In a flowchart, which shape represents a decision?",
    "options": [
     "Rectangle",
     "Oval",
     "Diamond",
     "Parallelogram"
    ],
    "correctIndex": 2,
    "explanation": "In flowcharts, a diamond shape represents a decision point.",
    "wrongExplanations": [
     "Rectangles are for processes.",
     "Ovals are for start/end.",
     "",
     "Parallelograms are for I/O."
    ]
   },
   {
    "question": "Which keyword is used to define a function in Python?",
    "options": [
     "func",
     "define",
     "def",
     "function"
    ],
    "correctIndex": 2,
    "explanation": "'def' is the keyword used in Python to define a function.",
    "wrongExplanations": [
     "func is not a Python keyword.",
     "define is not a Python keyword.",
     "",
     "function is used in JavaScript."
    ]
   },
   {
    "question": "What is the purpose of parameters in a function?",
    "options": [
     "Store output",
     "Take input",
     "Print values",
     "Stop execution"
    ],
    "correctIndex": 1,
    "explanation": "Parameters allow a function to receive input values when it's called.",
    "wrongExplanations": [
     "Return values store output.",
     "",
     "print() displays values.",
     "return or break stop execution."
    ]
   },
   {
    "question": "What is abstraction?",
    "options": [
     "Breaking problems",
     "Repeating code",
     "Hiding details",
     "Writing loops"
    ],
    "correctIndex": 2,
    "explanation": "Abstraction means hiding complex implementation details and showing only the essential features.",
    "wrongExplanations": [
     "Breaking problems is decomposition.",
     "Repeating code is bad practice.",
     "",
     "Writing loops is iteration."
    ]
   },
   {
    "question": "What is the output?\ndef test():\n    print(\"Hello\")\n\nresult = test()\nprint(result)",
    "options": [
     "Hello",
     "None",
     "Hello None",
     "Error"
    ],
    "correctIndex": 2,
    "explanation": "test() prints 'Hello', then returns None. print(result) prints None.",
    "wrongExplanations": [
     "Both prints occur.",
     "result is None.",
     "",
     "This is valid Python."
    ]
   },
   {
    "question": "Which of the following is a valid variable name?",
    "options": [
     "1name",
     "name_1",
     "name-1",
     "class"
    ],
    "correctIndex": 1,
    "explanation": "'name_1' is valid – it starts with a letter and isn't a reserved keyword.",
    "wrongExplanations": [
     "Variable names cannot start with numbers.",
     "",
     "Hyphens are not allowed.",
     "class is a reserved keyword."
    ]
   },
   {
    "question": "Which loop is used when the number of iterations is known?",
    "options": [
     "while",
     "for",
     "if",
     "try"
    ],
    "correctIndex": 1,
    "explanation": "A 'for' loop is used when you know how many times to iterate.",
    "wrongExplanations": [
     "while is for unknown iterations.",
     "",
     "if is a conditional.",
     "try is for error handling."
    ]
   },
   {
    "question": "What happens if a function has no return statement?",
    "options": [
     "Error",
     "Returns 0",
     "Returns None",
     "Stops program"
    ],
    "correctIndex": 2,
    "explanation": "If a function has no return statement, Python automatically returns None.",
    "wrongExplanations": [
     "No error occurs.",
     "It returns None, not 0.",
     "",
     "Program continues normally."
    ]
   },
   {
    "question": "What is modular programming?",
    "options": [
     "Writing long code",
     "Breaking code into smaller parts",
     "Avoiding functions",
     "Using only loops"
    ],
    "correctIndex": 1,
    "explanation": "Modular programming means breaking code into smaller, independent modules (functions/classes).",
    "wrongExplanations": [
     "Aim is to avoid long code.",
     "",
     "Functions are essential.",
     "Uses all structures."
    ]
   },
   {
    "question": "What is a class?",
    "options": [
     "A blueprint for creating objects",
     "A single instance of data",
     "A function in Python",
     "A variable inside a function"
    ],
    "correctIndex": 0,
    "explanation": "A class is a template or blueprint that defines attributes and methods for objects.",
    "wrongExplanations": [
     "",
     "A single instance is an object.",
     "Classes are broader than functions.",
     "Variable inside function is local."
    ]
   },
   {
    "question": "What is an object?",
    "options": [
     "A blueprint for classes",
     "An instance of a class",
     "A function definition",
     "A data type in Python"
    ],
    "correctIndex": 1,
    "explanation": "An object is a specific realization of a class with its own data.",
    "wrongExplanations": [
     "Classes are blueprints for objects.",
     "",
     "Function definition is a method.",
     "Object refers to the instance."
    ]
   },
   {
    "question": "Why do we use 'self'?",
    "options": [
     "To refer to the current instance of the class",
     "To define global variables",
     "To call static methods",
     "To import modules"
    ],
    "correctIndex": 0,
    "explanation": "'self' represents the specific object being operated on in instance methods.",
    "wrongExplanations": [
     "",
     "self is for instance data.",
     "Static methods don't use self.",
     "import is for modules."
    ]
   },
   {
    "question": "Name one pillar of OOP.",
    "options": [
     "Polymorphism",
     "Compilation",
     "Debugging",
     "Interpretation"
    ],
    "correctIndex": 0,
    "explanation": "The four pillars of OOP are Encapsulation, Abstraction, Inheritance, and Polymorphism.",
    "wrongExplanations": [
     "",
     "Compilation is a build process.",
     "Debugging is for fixing errors.",
     "Interpretation is for execution."
    ]
   }
  ]
 },
 {
  "id": "quiz6",
  "subject": "c",
  "semester": "Semester 2",
  "title": "Intro to C Quiz – Fundamentals & Syntax",
  "description": "Basic structure, data types, operators, control statements, and functions in C.",
  "questions": [
   {
    "question": "Which of these is NOT a reason to learn C?",
    "options": [
     "It's the foundation of many modern languages",
     "It improves understanding of memory management",
     "It's commonly used in system programming and embedded systems",
     "It automatically manages memory for you"
    ],
    "correctIndex": 3,
    "explanation": "C requires manual memory management – this is exactly what makes it useful for learning how memory works. Modern garbage-collected languages, not C, handle memory automatically.",
    "wrongExplanations": [
     "C is indeed the foundation of many modern languages (C++, Java, C#, etc.).",
     "Writing C forces you to think about memory allocation directly.",
     "C is widely used in system programming, embedded systems, and IoT.",
     ""
    ]
   },
   {
    "question": "Which character begins a preprocessor directive in C?",
    "options": [
     "@",
     "$",
     "#",
     "&"
    ],
    "correctIndex": 2,
    "explanation": "The pound sign (#) marks the beginning of a preprocessor directive, such as #include <stdio.h>.",
    "wrongExplanations": [
     "'@' has no special meaning in standard C syntax.",
     "'$' has no special meaning in standard C syntax.",
     "",
     "'&' is the bitwise AND / address-of operator, not a preprocessor marker."
    ]
   },
   {
    "question": "What does #include <stdio.h> do?",
    "options": [
     "Defines the main function",
     "Brings in the standard input/output library",
     "Declares a variable named stdio",
     "Ends the program"
    ],
    "correctIndex": 1,
    "explanation": "#include <stdio.h> tells the preprocessor to include the standard input/output header, giving access to functions like printf() and scanf().",
    "wrongExplanations": [
     "main() is defined separately with 'int main() { ... }'.",
     "",
     "It's a header inclusion, not a variable declaration.",
     "'return 0;' inside main ends the program, not #include."
    ]
   },
   {
    "question": "How do you write a single-line style comment block in C using the traditional syntax?",
    "options": [
     "// comment //",
     "# comment #",
     "/* comment */",
     "<!-- comment -->"
    ],
    "correctIndex": 2,
    "explanation": "/* */ marks the beginning and end of a comment in C. (C also supports // for single-line comments, but /* */ is the traditional block comment syntax shown in the lecture.)",
    "wrongExplanations": [
     "'//' alone starts a comment but doesn't need a closing '//'.",
     "'#' is used for preprocessor directives, not comments.",
     "",
     "'<!-- -->' is HTML/XML comment syntax, not C."
    ]
   },
   {
    "question": "What must end every C programming statement?",
    "options": [
     "A colon (:)",
     "A semicolon (;)",
     "A period (.)",
     "A comma (,)"
    ],
    "correctIndex": 1,
    "explanation": "A semicolon (;) marks the end of a programming statement in C.",
    "wrongExplanations": [
     "Colons are used in other contexts (like switch/case labels), not statement endings.",
     "",
     "Periods aren't used to terminate C statements.",
     "Commas separate items (like function arguments), they don't end statements."
    ]
   },
   {
    "question": "Which data type would you use to store a whole number like 42?",
    "options": [
     "float",
     "char",
     "int",
     "double"
    ],
    "correctIndex": 2,
    "explanation": "'int' is used for integers – whole numbers without a decimal point.",
    "wrongExplanations": [
     "'float' stores numbers with decimal points.",
     "'char' stores a single character.",
     "",
     "'double' stores decimal numbers with higher precision than float."
    ]
   },
   {
    "question": "Which header must you include to use the boolean type _Bool conveniently (true/false)?",
    "options": [
     "stdio.h",
     "stdlib.h",
     "stdbool.h",
     "string.h"
    ],
    "correctIndex": 2,
    "explanation": "stdbool.h provides the bool type along with the true and false keywords for working with _Bool more conveniently.",
    "wrongExplanations": [
     "stdio.h provides input/output functions like printf and scanf.",
     "stdlib.h provides general utilities like rand() and malloc().",
     "",
     "string.h provides string manipulation functions."
    ]
   },
   {
    "question": "Which operator checks if two values are NOT equal in C?",
    "options": [
     "=",
     "==",
     "!=",
     "<>"
    ],
    "correctIndex": 2,
    "explanation": "'!=' is the relational 'not equal to' operator in C.",
    "wrongExplanations": [
     "A single '=' is the assignment operator, not a comparison.",
     "'==' checks if two values ARE equal.",
     "",
     "'<>' is not a valid C operator (it's used in some other languages)."
    ]
   },
   {
    "question": "Which operator is the logical AND in C?",
    "options": [
     "&",
     "&&",
     "|",
     "and"
    ],
    "correctIndex": 1,
    "explanation": "'&&' is the logical AND operator, used to combine boolean conditions. '&' is the bitwise AND operator instead.",
    "wrongExplanations": [
     "A single '&' is the bitwise AND operator, not logical AND.",
     "",
     "'|' is the bitwise OR operator.",
     "'and' is not a valid C operator keyword."
    ]
   },
   {
    "question": "Which loop is guaranteed to execute its body at least once?",
    "options": [
     "for",
     "while",
     "do-while",
     "if"
    ],
    "correctIndex": 2,
    "explanation": "A do-while loop checks its condition after executing the loop body, so the body always runs at least once.",
    "wrongExplanations": [
     "A 'for' loop may run zero times if the condition is false from the start.",
     "A 'while' loop checks its condition first, so it may never execute.",
     "",
     "'if' is a conditional statement, not a loop."
    ]
   },
   {
    "question": "What is the purpose of a function prototype/declaration in C?",
    "options": [
     "To run the function immediately",
     "To tell the compiler about a function's signature before it's used",
     "To delete a function",
     "To print the function's output"
    ],
    "correctIndex": 1,
    "explanation": "A function prototype declares the function's name, return type, and parameters ahead of its use or definition, so the compiler knows how to check calls to it.",
    "wrongExplanations": [
     "A declaration doesn't execute the function; calling it does.",
     "",
     "There's no concept of 'deleting' a function in C.",
     "Prototypes don't print anything; printf() does that."
    ]
   },
   {
    "question": "Which library function, from stdlib.h, is used to generate random numbers in C?",
    "options": [
     "random()",
     "rand()",
     "generate()",
     "randomize()"
    ],
    "correctIndex": 1,
    "explanation": "rand(), declared in stdlib.h, generates pseudo-random numbers – as used in the Number Guessing Game exercise.",
    "wrongExplanations": [
     "'random()' is not the standard C library function name.",
     "",
     "'generate()' is not a C standard library function.",
     "'randomize()' is not a standard C library function."
    ]
   }
  ]
 },
 {
  "id": "quiz7",
  "subject": "c",
  "semester": "Semester 2",
  "title": "C Lecture 2 Quiz – Fundamentals & Variables",
  "description": "Features of C, program structure, data types, variables, constants, and error types.",
  "questions": [
   {
    "question": "Which of these is a feature of C described in the lecture?",
    "options": [
     "A powerful low-level language with memory access through pointers",
     "Purely object-oriented with no procedural support",
     "No support for modular programming",
     "Automatic garbage collection"
    ],
    "correctIndex": 0,
    "explanation": "C is a general-purpose procedural language that is simple, efficient, and powerful at a low level, giving access to memory through pointers, while also supporting modular programming.",
    "wrongExplanations": [
     "",
     "C is a procedural language, not purely object-oriented.",
     "C explicitly supports modular programming through functions.",
     "C has no automatic garbage collector; memory is managed manually."
    ]
   },
   {
    "question": "In the structure of a C program, what is int main() ?",
    "options": [
     "A preprocessor directive",
     "The main function where program execution begins",
     "A single-line comment",
     "A curly brace block with no purpose"
    ],
    "correctIndex": 1,
    "explanation": "int main() is the main function where every C program begins execution.",
    "wrongExplanations": [
     "Preprocessor directives start with '#', like #include.",
     "",
     "Comments start with // or /* */, not int main().",
     "The curly braces define the function's body, but main() itself is the entry point function."
    ]
   },
   {
    "question": "Is C case-sensitive?",
    "options": [
     "Yes, 'main' and 'Main' are treated as different identifiers",
     "No, C ignores letter case entirely",
     "Only variable names are case-sensitive",
     "Only function names are case-sensitive"
    ],
    "correctIndex": 0,
    "explanation": "C is case-sensitive, so 'main' and 'Main' would be treated as two completely different identifiers.",
    "wrongExplanations": [
     "",
     "C does distinguish between uppercase and lowercase letters.",
     "Case sensitivity applies to all identifiers, not just variables.",
     "Case sensitivity applies to all identifiers, not just functions."
    ]
   },
   {
    "question": "Which of the following correctly declares an integer variable named age?",
    "options": [
     "int age;",
     "age int;",
     "integer age;",
     "var age;"
    ],
    "correctIndex": 0,
    "explanation": "The correct syntax for declaring a variable in C is data_type variable_name;, so 'int age;' declares an integer variable called age.",
    "wrongExplanations": [
     "",
     "The data type must come before the variable name, not after.",
     "'integer' is not a valid C keyword; the correct keyword is 'int'.",
     "'var' is not a C keyword for declaring variables."
    ]
   },
   {
    "question": "What are the two broad categories of data types in C?",
    "options": [
     "Primitive and Derived",
     "Static and Dynamic",
     "Public and Private",
     "Local and Global"
    ],
    "correctIndex": 0,
    "explanation": "C data types fall into two broad categories: Primitive Data Types (int, float, char, etc.) and Derived Data Types (arrays, pointers, functions, structures).",
    "wrongExplanations": [
     "",
     "Static and dynamic describe storage duration, not this data type grouping.",
     "Public and private are access modifiers from other languages like C++/Java, not C data type categories.",
     "Local and global describe variable scope, not data type categories."
    ]
   },
   {
    "question": "Among the integer types short, int, long, and long long, which generally requires the least memory?",
    "options": [
     "short",
     "int",
     "long",
     "long long"
    ],
    "correctIndex": 0,
    "explanation": "'short' requires less memory than the others but has a smaller range, while 'long long' requires more memory but supports a much larger range.",
    "wrongExplanations": [
     "",
     "'int' typically uses more memory than 'short'.",
     "'long' uses more memory than both 'short' and 'int'.",
     "'long long' requires the most memory among these types."
    ]
   },
   {
    "question": "Which data type provides higher decimal precision: float or double?",
    "options": [
     "double",
     "float",
     "int",
     "char"
    ],
    "correctIndex": 0,
    "explanation": "'double' provides up to 15 decimal places of precision, while 'float' only provides about 6.",
    "wrongExplanations": [
     "",
     "'float' has lower precision (about 6 decimal places) than 'double'.",
     "'int' stores whole numbers only and has no decimal precision.",
     "'char' stores a single character, not decimal numbers."
    ]
   },
   {
    "question": "What does the 'typedef' keyword do in C?",
    "options": [
     "Gives a new name to an existing data type",
     "Deletes a data type from the program",
     "Automatically converts a variable to a pointer",
     "Defines a new function"
    ],
    "correctIndex": 0,
    "explanation": "typedef creates an alias for an existing type, e.g., 'typedef int integer;' lets you use 'integer' in place of 'int'.",
    "wrongExplanations": [
     "",
     "typedef does not delete anything; it only creates aliases.",
     "typedef does not perform pointer conversion.",
     "Functions are defined with a return type and parameter list, not typedef."
    ]
   },
   {
    "question": "Which of the following is a valid character constant in C?",
    "options": [
     "'A'",
     "\"A\"",
     "A",
     "(A)"
    ],
    "correctIndex": 0,
    "explanation": "A character constant is a single character enclosed in single quotation marks, such as 'A'.",
    "wrongExplanations": [
     "",
     "Double quotes are used for string constants, not single character constants.",
     "Without quotes, A would be interpreted as an identifier, not a character constant.",
     "Parentheses are used for grouping or function calls, not character constants."
    ]
   },
   {
    "question": "Which of the following is a string constant in C?",
    "options": [
     "\"Hello\"",
     "'Hello'",
     "Hello",
     "(Hello)"
    ],
    "correctIndex": 0,
    "explanation": "A string constant (string literal) is a sequence of characters surrounded by double quotation marks, such as \"Hello\".",
    "wrongExplanations": [
     "",
     "Single quotes are reserved for single character constants, not multi-character strings.",
     "Without quotes, Hello would be treated as an identifier.",
     "Parentheses do not denote string constants in C."
    ]
   },
   {
    "question": "Which error type is NOT caught by the compiler but still produces incorrect output?",
    "options": [
     "Logical error",
     "Syntax error",
     "Compilation error",
     "Linker error naming a missing semicolon"
    ],
    "correctIndex": 0,
    "explanation": "Logical errors go unnoticed by the compiler but cause the program to produce incorrect or unexpected results.",
    "wrongExplanations": [
     "",
     "Syntax errors are caught and reported by the compiler.",
     "Compilation errors are, by definition, caught during compilation.",
     "Missing semicolons are syntax errors, which the compiler does catch."
    ]
   },
   {
    "question": "Which of these is an example of a runtime error?",
    "options": [
     "Dividing a number by zero",
     "A missing semicolon at the end of a statement",
     "A misspelled keyword",
     "Mismatched parentheses"
    ],
    "correctIndex": 0,
    "explanation": "Runtime errors occur when a program attempts an illegal operation while executing, such as dividing by zero.",
    "wrongExplanations": [
     "",
     "A missing semicolon is a syntax error, caught at compile time.",
     "A misspelled keyword is a syntax error, caught at compile time.",
     "Mismatched parentheses are a syntax error, caught at compile time."
    ]
   }
  ]
 },
 {
  "id": "quiz8",
  "subject": "c",
  "semester": "Semester 2",
  "title": "C Lecture 3 Quiz – Arithmetic Expressions",
  "description": "Arithmetic, relational, logical, and increment/decrement operators, precedence, and type conversion.",
  "questions": [
   {
    "question": "Which operator computes the remainder of integer division in C?",
    "options": [
     "%",
     "/",
     "*",
     "//"
    ],
    "correctIndex": 0,
    "explanation": "The modulus operator '%' returns the remainder after integer division, e.g., b % 3.",
    "wrongExplanations": [
     "",
     "'/' performs division, returning the quotient, not the remainder.",
     "'*' performs multiplication.",
     "'//' is not a valid C operator (it's a comment marker in some contexts, but not division)."
    ]
   },
   {
    "question": "Given int a = 4, b = 5, what is the value of d after d = a + b;?",
    "options": [
     "9",
     "20",
     "1",
     "-1"
    ],
    "correctIndex": 0,
    "explanation": "Addition of a (4) and b (5) gives 9, which is assigned to d.",
    "wrongExplanations": [
     "",
     "20 would be the result of a * b, not a + b.",
     "1 would be the result of b - a, not a + b.",
     "-1 would be the result of a - b, not a + b."
    ]
   },
   {
    "question": "Which assignment operator multiplies a variable by a value and stores the result back in that variable?",
    "options": [
     "*=",
     "*+",
     "=*",
     "**="
    ],
    "correctIndex": 0,
    "explanation": "'*=' is shorthand for 'x = x * value', e.g., x *= z is equivalent to x = x * z.",
    "wrongExplanations": [
     "",
     "'*+' is not a valid C operator.",
     "'=*' is not a valid C operator.",
     "'**=' is not a valid C operator; C has no exponent operator."
    ]
   },
   {
    "question": "Given int y = 6, x = 5, which expression evaluates to true?",
    "options": [
     "y > x",
     "y < 2",
     "y <= x",
     "x >= 6"
    ],
    "correctIndex": 0,
    "explanation": "y > x is 6 > 5, which is true.",
    "wrongExplanations": [
     "",
     "y < 2 is 6 < 2, which is false.",
     "y <= x is 6 <= 5, which is false.",
     "x >= 6 is 5 >= 6, which is false."
    ]
   },
   {
    "question": "Which equality operator checks that two values are NOT equal?",
    "options": [
     "!=",
     "==",
     "<>",
     "!=="
    ],
    "correctIndex": 0,
    "explanation": "'!=' is C's 'not equal to' operator.",
    "wrongExplanations": [
     "",
     "'==' checks that two values ARE equal.",
     "'<>' is not a valid C operator (used in some other languages).",
     "'!==' is not a valid C operator (used in some other languages like JavaScript)."
    ]
   },
   {
    "question": "Among the logical operators, which has the highest precedence?",
    "options": [
     "! (NOT)",
     "&& (AND)",
     "|| (OR)",
     "All three have equal precedence"
    ],
    "correctIndex": 0,
    "explanation": "The logical operators are ranked: ! has the highest precedence, followed by &&, then ||.",
    "wrongExplanations": [
     "",
     "&& has lower precedence than !.",
     "|| has the lowest precedence of the three.",
     "Their precedence differs: ! > && > ||."
    ]
   },
   {
    "question": "If x = 50, what does the expression !(x == 60) evaluate to?",
    "options": [
     "True (1)",
     "False (0)",
     "60",
     "Error"
    ],
    "correctIndex": 0,
    "explanation": "x == 60 is false since x is 50; the NOT operator (!) reverses false to true.",
    "wrongExplanations": [
     "",
     "The expression evaluates to true, not false, since the inner comparison is false.",
     "The result of a logical expression is true/false (1/0), not the compared value.",
     "This is valid, well-formed C syntax."
    ]
   },
   {
    "question": "What is the key difference between a++ and ++a?",
    "options": [
     "a++ uses the current value before incrementing; ++a increments first, then uses the new value",
     "They behave identically in every context",
     "a++ is invalid C syntax",
     "++a only works with floating-point variables"
    ],
    "correctIndex": 0,
    "explanation": "Postincrement (a++) uses a's current value in the expression, then increments it; preincrement (++a) increments a first, then uses the new value.",
    "wrongExplanations": [
     "",
     "They can produce different results when used within a larger expression.",
     "a++ (postincrement) is valid, standard C syntax.",
     "Increment operators work with integer types as well as floating-point types."
    ]
   },
   {
    "question": "In the expression 8 + 12 * (6 - 2), which part is evaluated first according to operator precedence?",
    "options": [
     "The parentheses (6 - 2)",
     "The addition 8 + 12",
     "The multiplication 12 * 8",
     "Evaluation always proceeds strictly left to right regardless of operators"
    ],
    "correctIndex": 0,
    "explanation": "Parentheses have the highest precedence in C, so (6 - 2) is evaluated first, followed by multiplication, then addition.",
    "wrongExplanations": [
     "",
     "Addition has lower precedence than both parentheses and multiplication.",
     "The expression is 12 * (6-2), not 12 * 8; also multiplication follows the parenthesized calculation.",
     "C follows operator precedence rules, not pure left-to-right evaluation."
    ]
   },
   {
    "question": "What is the value of the expression (5 + 2) * 4?",
    "options": [
     "28",
     "9",
     "20",
     "24"
    ],
    "correctIndex": 0,
    "explanation": "(5 + 2) = 7, and 7 * 4 = 28.",
    "wrongExplanations": [
     "",
     "9 is just 5 + 2 without the multiplication.",
     "20 would result from 5 * 4, ignoring the +2.",
     "24 would result from 2 * 4 plus something else, not this expression."
    ]
   },
   {
    "question": "When an operation involves operands of different types (e.g., an int and a double), what does C do?",
    "options": [
     "Promotes the 'smaller' type to the 'larger' type before the operation",
     "Always converts both operands to int",
     "Raises a compile-time error",
     "Ignores the smaller operand entirely"
    ],
    "correctIndex": 0,
    "explanation": "C automatically promotes the smaller type (e.g., char, int) to the larger type (e.g., float, double) so the operation can proceed consistently.",
    "wrongExplanations": [
     "",
     "Converting to int would lose precision; C promotes toward the larger type instead.",
     "This type promotion is valid and does not cause a compile error.",
     "Both operands are used; the smaller one is converted, not dropped."
    ]
   },
   {
    "question": "What is type casting used for in C?",
    "options": [
     "Manually converting a variable from one data type to another",
     "Declaring a brand-new variable",
     "Naming a constant",
     "Creating a loop"
    ],
    "correctIndex": 0,
    "explanation": "Type casting, written as (data type)variable, is used to manually convert a value's type, such as forcing floating-point division using integer variables.",
    "wrongExplanations": [
     "",
     "Declaring a variable uses syntax like 'int x;', not casting.",
     "Naming a constant uses 'const', not casting.",
     "Loops use for/while/do-while, unrelated to type casting."
    ]
   },
   {
    "question": "Which header file must be included to use math library functions like sqrt() and pow()?",
    "options": [
     "math.h",
     "stdio.h",
     "stdlib.h",
     "ctype.h"
    ],
    "correctIndex": 0,
    "explanation": "math.h declares mathematical functions such as sqrt(), pow(), exp(), and log().",
    "wrongExplanations": [
     "",
     "stdio.h provides input/output functions like printf and scanf.",
     "stdlib.h provides utilities like abs(), rand(), and memory allocation.",
     "ctype.h provides character classification functions like isdigit()."
    ]
   }
  ]
 },
 {
  "id": "quiz9",
  "subject": "c",
  "semester": "Semester 2",
  "title": "C Lecture 4 Quiz – Selection & Branching",
  "description": "If statements, else-if ladders, nested conditionals, the conditional operator, and switch statements.",
  "questions": [
   {
    "question": "What is the primary purpose of control structures like if statements?",
    "options": [
     "To perform different actions depending on whether a condition is true or false",
     "To store data permanently on disk",
     "To define new functions",
     "To import external libraries"
    ],
    "correctIndex": 0,
    "explanation": "Selection/branch control structures let a program react differently to different conditions, which is critical for decision making.",
    "wrongExplanations": [
     "",
     "Persistent storage is handled by file I/O, not selection statements.",
     "Functions are defined with a return type and parameter list, not if statements.",
     "Libraries are imported with #include, not selection statements."
    ]
   },
   {
    "question": "In an if statement's flow, what happens when the condition evaluates to false?",
    "options": [
     "The associated statement is skipped",
     "The program crashes immediately",
     "The statement executes twice",
     "The program terminates without finishing"
    ],
    "correctIndex": 0,
    "explanation": "If the expression is false, the statement inside the if is simply skipped, and execution continues after it.",
    "wrongExplanations": [
     "",
     "A false condition does not cause a crash; it's normal control flow.",
     "The statement runs when the condition is true, not extra times when false.",
     "The program continues running after the if statement, it does not terminate."
    ]
   },
   {
    "question": "What is the else-if ladder used for?",
    "options": [
     "Testing multiple conditions in sequence, one after another",
     "Repeating a block of code multiple times",
     "Declaring multiple variables at once",
     "Defining a function that can return multiple values"
    ],
    "correctIndex": 0,
    "explanation": "An else-if ladder (if / else if / else if / else) lets a program test several conditions in order until one matches.",
    "wrongExplanations": [
     "",
     "Repetition is handled by loops (for, while, do-while), not else-if ladders.",
     "Multiple variable declarations don't require else-if.",
     "C functions return exactly one value; else-if doesn't change that."
    ]
   },
   {
    "question": "What are nested conditional statements?",
    "options": [
     "Conditional statements placed inside other conditional statements",
     "Two unrelated if statements in completely different files",
     "Loops placed inside functions",
     "Arrays that store condition results"
    ],
    "correctIndex": 0,
    "explanation": "Nesting means putting an if (or if-else) statement inside the body of another if (or if-else) statement.",
    "wrongExplanations": [
     "",
     "Nesting refers to structural placement within the same code, not separate files.",
     "That describes function/loop nesting, not conditional nesting specifically.",
     "Arrays store data values, not the structural nesting of conditionals."
    ]
   },
   {
    "question": "What is the shorthand syntax for an if-else statement called?",
    "options": [
     "The conditional (ternary) operator",
     "The switch statement",
     "A nested if",
     "The logical AND operator"
    ],
    "correctIndex": 0,
    "explanation": "The conditional operator, written as condition ? expressionTrue : expressionFalse, is a shorthand for a simple if-else statement.",
    "wrongExplanations": [
     "",
     "The switch statement is a separate control structure for testing many discrete values.",
     "A nested if is an if inside another if, not a shorthand notation.",
     "&& is used to combine boolean conditions, not as an if-else shorthand."
    ]
   },
   {
    "question": "In the statement y = (x == 10) ? 1 : 0;, what does y equal if x is NOT 10?",
    "options": [
     "0",
     "1",
     "10",
     "Undefined behavior"
    ],
    "correctIndex": 0,
    "explanation": "Since the condition (x == 10) is false when x isn't 10, the conditional operator returns the expressionFalse value, which is 0.",
    "wrongExplanations": [
     "",
     "1 is returned only when the condition (x == 10) is true.",
     "The expression yields 1 or 0, never the value of x itself.",
     "This is well-defined behavior, not undefined."
    ]
   },
   {
    "question": "What must the expression in a switch statement evaluate to?",
    "options": [
     "An integer variable or an expression that evaluates to an integer value",
     "A floating-point value",
     "A string of characters",
     "A boolean value only"
    ],
    "correctIndex": 0,
    "explanation": "Switch requirements state the expression must be an integer variable or evaluate to an integer value (character constants like 'A' also work since they're integer-compatible).",
    "wrongExplanations": [
     "",
     "Floating-point values are not valid switch expressions in standard C.",
     "Strings cannot be directly used as a switch expression in C.",
     "Booleans aren't a distinct type here; the requirement is specifically integer-based."
    ]
   },
   {
    "question": "What is the purpose of the 'default' case in a switch statement?",
    "options": [
     "It executes when none of the other cases match the expression",
     "It always executes first, before any other case",
     "It declares the switch's controlling variable",
     "It forcibly ends the entire program"
    ],
    "correctIndex": 0,
    "explanation": "If no case value matches the switch expression, execution branches to the statement following 'default:'.",
    "wrongExplanations": [
     "",
     "default only runs if no case matches; it doesn't run first automatically.",
     "The switch variable is declared before the switch statement, not by default.",
     "default just runs its own block of code; it doesn't end the program."
    ]
   },
   {
    "question": "What happens if a 'break' statement is omitted at the end of a matched case in a switch block?",
    "options": [
     "Execution falls through and continues into the next case's statements",
     "The switch statement causes a compile-time error",
     "The program skips the entire switch block",
     "The default case runs immediately instead"
    ],
    "correctIndex": 0,
    "explanation": "Without 'break', execution 'falls through' into the following case's code, executing it too, until a break or the end of the switch is reached.",
    "wrongExplanations": [
     "",
     "Omitting break is valid C syntax, not a compile error.",
     "The matched case's code still executes; it just continues into the next case.",
     "default only executes if reached in the fall-through sequence or if no case matched."
    ]
   },
   {
    "question": "In the Simple Calculator exercise, what should the program do if the operator is '/' and the second number is zero?",
    "options": [
     "Display a warning instead of performing the division",
     "Perform the division anyway and show an error number",
     "Silently default to multiplication instead",
     "Crash without displaying any message"
    ],
    "correctIndex": 0,
    "explanation": "The exercise specifies that if division is selected and the second number is zero, the program should display a warning rather than attempting the division.",
    "wrongExplanations": [
     "",
     "Dividing by zero should be caught and warned about, not silently performed.",
     "The exercise doesn't call for silently switching operations.",
     "The requirement is to handle the error gracefully with a warning, not crash."
    ]
   }
  ]
 },
 {
  "id": "quiz10",
  "subject": "c",
  "semester": "Semester 2",
  "title": "C Lecture 5 Quiz – Loops",
  "description": "For, while, and do-while loops, nested loops, infinite loops, and break/continue.",
  "questions": [
   {
    "question": "What is the main benefit of using loops in programming?",
    "options": [
     "They eliminate repetitive code by repeating a block under certain conditions",
     "They allow a program to run without a CPU",
     "They automatically translate code into machine language",
     "They automatically fix logical bugs in a program"
    ],
    "correctIndex": 0,
    "explanation": "Loops reduce redundancy by repeating a block of code as needed, controlled by loop condition statements, increasing code efficiency.",
    "wrongExplanations": [
     "",
     "All code, including loops, still requires a CPU to execute.",
     "Compilation is a separate process, unrelated to what loops do.",
     "Loops don't fix bugs; they simply repeat code as instructed."
    ]
   },
   {
    "question": "What are the two main parts every loop must have?",
    "options": [
     "Body and condition",
     "Header and footer",
     "Class and object",
     "Input and output"
    ],
    "correctIndex": 0,
    "explanation": "Every loop has a body (the statements to repeat) and a condition (which controls whether to continue or stop iterating).",
    "wrongExplanations": [
     "",
     "Header/footer are not standard loop terminology in C.",
     "Classes and objects are OOP concepts, not part of C's loop structure.",
     "Input/output describes data flow, not the structural parts of a loop."
    ]
   },
   {
    "question": "Which loop's syntax has three components: initialization, condition, and iteration, all in its header?",
    "options": [
     "for loop",
     "while loop",
     "do-while loop",
     "if statement"
    ],
    "correctIndex": 0,
    "explanation": "The for loop syntax is for(initialization; condition; iteration) { }, combining all three parts in one line.",
    "wrongExplanations": [
     "",
     "A while loop only has a condition in its header; initialization and iteration are handled separately.",
     "A do-while loop's condition is checked after the body, and it also lacks the three-part header.",
     "if is a conditional statement, not a loop, and has no iteration component."
    ]
   },
   {
    "question": "In for (n = 10; n > 0; n = n - 1), how many times does the loop body execute?",
    "options": [
     "10 times",
     "9 times",
     "11 times",
     "Infinitely"
    ],
    "correctIndex": 0,
    "explanation": "n starts at 10 and decreases by 1 each iteration until n > 0 is false (when n reaches 0), so the body runs for n = 10, 9, ..., 1 — 10 times total.",
    "wrongExplanations": [
     "",
     "The loop includes n = 10 down to n = 1, which is 10 iterations, not 9.",
     "The loop stops once n is no longer greater than 0, so it doesn't run 11 times.",
     "The condition n > 0 will eventually become false, so the loop is not infinite."
    ]
   },
   {
    "question": "What is a key characteristic of a while loop?",
    "options": [
     "It continues executing as long as its condition remains true",
     "It always executes exactly once, no matter what",
     "It requires no condition at all",
     "It can only count upward, never downward"
    ],
    "correctIndex": 0,
    "explanation": "A while loop repeats its body as long as the specified condition evaluates to true, and stops once it becomes false.",
    "wrongExplanations": [
     "",
     "A while loop may execute zero times if the condition is false from the start.",
     "A while loop always requires a condition inside its parentheses.",
     "A while loop's counting behavior depends entirely on how its condition and body are written."
    ]
   },
   {
    "question": "What makes a do-while loop different from a while loop?",
    "options": [
     "The do-while loop checks its condition after executing the body once",
     "The do-while loop never checks any condition",
     "The do-while loop cannot contain any statements",
     "The do-while loop only works with arrays"
    ],
    "correctIndex": 0,
    "explanation": "In a do-while loop, the body executes first, and the condition is checked afterward — guaranteeing at least one execution, unlike a while loop.",
    "wrongExplanations": [
     "",
     "A do-while loop does check a condition, just after the body rather than before.",
     "A do-while loop's body can contain any statements, just like other loops.",
     "do-while loops work with any repeatable logic, not just arrays."
    ]
   },
   {
    "question": "What is a nested loop?",
    "options": [
     "A loop placed inside the body of another loop",
     "A loop with an empty body",
     "A loop that never terminates by design",
     "Two loops that run simultaneously on separate threads"
    ],
    "correctIndex": 0,
    "explanation": "A nested loop is a loop inside another loop, where the inner loop runs completely for each single iteration of the outer loop.",
    "wrongExplanations": [
     "",
     "An empty body is unrelated to nesting; nested loops usually have meaningful bodies.",
     "Nested loops are not inherently infinite; they still rely on their own conditions.",
     "C loops in this context run sequentially, not on separate threads, unless explicit threading is used."
    ]
   },
   {
    "question": "What is an infinite loop?",
    "options": [
     "A loop without an ending or breaking condition",
     "A loop that runs exactly one time",
     "A loop that contains a syntax error",
     "A loop that can only be written using do-while"
    ],
    "correctIndex": 0,
    "explanation": "An infinite loop, like while(1) { }, has no condition that will ever become false or break, so it repeats endlessly unless explicitly stopped.",
    "wrongExplanations": [
     "",
     "Running exactly once is the opposite of an infinite loop's behavior.",
     "Infinite loops are syntactically valid; the issue is logical, not a syntax error.",
     "Infinite loops can be written with for, while, or do-while."
    ]
   },
   {
    "question": "What does the 'break' statement do inside a loop?",
    "options": [
     "Terminates the loop immediately, transferring control to the statement after it",
     "Skips only the current iteration and continues the loop",
     "Pauses the loop temporarily until resumed",
     "Restarts the loop from its very beginning"
    ],
    "correctIndex": 0,
    "explanation": "'break' exits the loop entirely and execution continues at the statement immediately following the loop.",
    "wrongExplanations": [
     "",
     "Skipping just the current iteration is the behavior of 'continue', not 'break'.",
     "C loops have no built-in 'pause' mechanism; break exits completely.",
     "'break' does not restart the loop; it ends it."
    ]
   },
   {
    "question": "What does the 'continue' statement do inside a loop?",
    "options": [
     "Skips the rest of the current iteration and moves to the next one",
     "Terminates the loop entirely",
     "Declares a brand-new loop control variable",
     "Has no effect on the loop's execution"
    ],
    "correctIndex": 0,
    "explanation": "'continue' skips any remaining code in the current iteration and proceeds directly to the next iteration's condition check.",
    "wrongExplanations": [
     "",
     "Terminating the loop entirely is what 'break' does, not 'continue'.",
     "'continue' does not declare variables; it affects control flow only.",
     "'continue' changes execution flow by skipping the rest of the current iteration."
    ]
   },
   {
    "question": "Which loop type is generally best used when the number of iterations is known in advance?",
    "options": [
     "for loop",
     "while loop",
     "do-while loop",
     "They are all identical in this regard"
    ],
    "correctIndex": 0,
    "explanation": "A for loop is ideal when the iteration count is known, since initialization, condition, and update are all defined together in its header.",
    "wrongExplanations": [
     "",
     "A while loop is best suited for cases where the number of iterations is unknown and depends on a runtime condition.",
     "A do-while loop is chosen mainly when at least one execution is required, not specifically for known iteration counts.",
     "Each loop type has different best-use scenarios, as summarized in the comparison table."
    ]
   }
  ]
 },
 {
  "id": "quiz11",
  "subject": "c",
  "semester": "Semester 2",
  "title": "C Lecture 6 Quiz – I/O Operations",
  "description": "I/O streams, printf/scanf formatting, and file input/output basics.",
  "questions": [
   {
    "question": "What are I/O streams in C?",
    "options": [
     "Channels for data flow between a program and its input/output sources",
     "Variables that can only store integers",
     "Loops that iterate over array elements",
     "Functions that work exclusively with files"
    ],
    "correctIndex": 0,
    "explanation": "I/O streams are channels for data flow, with sources/destinations like the keyboard, screen, files, or network connections.",
    "wrongExplanations": [
     "",
     "Streams are a data-flow concept, not tied to a specific variable type.",
     "Loops are control structures; streams are about data channels.",
     "Streams also apply to console I/O (keyboard/screen), not just files."
    ]
   },
   {
    "question": "Which C function reads formatted input from the keyboard (stdin)?",
    "options": [
     "scanf",
     "printf",
     "fopen",
     "fclose"
    ],
    "correctIndex": 0,
    "explanation": "scanf reads formatted input from stdin, e.g., scanf(\"%d\", &age);",
    "wrongExplanations": [
     "",
     "printf writes formatted output, it does not read input.",
     "fopen opens a file; it doesn't read keyboard input directly.",
     "fclose closes an open file; it's unrelated to reading input."
    ]
   },
   {
    "question": "Which C function writes formatted output to the screen (stdout)?",
    "options": [
     "printf",
     "scanf",
     "fgets",
     "fopen"
    ],
    "correctIndex": 0,
    "explanation": "printf writes formatted output to stdout, e.g., printf(\"%d\", number);",
    "wrongExplanations": [
     "",
     "scanf reads input; it does not write output.",
     "fgets reads a string, typically from a file or stdin, not writing output.",
     "fopen opens a file; it doesn't perform output formatting."
    ]
   },
   {
    "question": "Which printf format specifier displays a floating-point number like 1234.56?",
    "options": [
     "%f",
     "%d",
     "%c",
     "%s"
    ],
    "correctIndex": 0,
    "explanation": "%f is used for float values shown as fractions, e.g., 1234.56.",
    "wrongExplanations": [
     "",
     "%d is used for integers, not fractional numbers.",
     "%c is used for a single character.",
     "%s is used for strings (phrases), not numeric fractions."
    ]
   },
   {
    "question": "Which printf format specifier is used to display a double value?",
    "options": [
     "%lf",
     "%d",
     "%c",
     "%u"
    ],
    "correctIndex": 0,
    "explanation": "%lf is the format specifier for double (fraction) values, e.g., 1234.56.",
    "wrongExplanations": [
     "",
     "%d is for integers, not double values.",
     "%c is for a single character.",
     "%u is for unsigned integers, not double values."
    ]
   },
   {
    "question": "Why is the '&' operator important when reading a variable with scanf?",
    "options": [
     "It passes the address of the variable so scanf can store the input there",
     "It converts the variable into a string automatically",
     "It multiplies the value read by scanf",
     "It is optional and has no real effect"
    ],
    "correctIndex": 0,
    "explanation": "scanf needs the variable's memory address (via &) to know where to store the value it reads, e.g., scanf(\"%d\", &age);",
    "wrongExplanations": [
     "",
     "'&' provides an address, it does not perform string conversion.",
     "'&' has nothing to do with arithmetic multiplication here.",
     "Omitting '&' for non-array/non-pointer variables is a common and serious bug, not a no-op."
    ]
   },
   {
    "question": "Which function helps safely read a string of text and avoid buffer overflow?",
    "options": [
     "fgets",
     "an unrestricted scanf with %s and no width limit",
     "gets (deprecated)",
     "putchar"
    ],
    "correctIndex": 0,
    "explanation": "fgets(str, size, stdin) reads a string while respecting a maximum buffer size, helping avoid overflow, unlike unguarded input functions.",
    "wrongExplanations": [
     "",
     "Unrestricted %s in scanf can overflow the destination buffer if input is too long.",
     "gets() is deprecated/unsafe precisely because it doesn't limit input length.",
     "putchar writes a single character; it doesn't read strings."
    ]
   },
   {
    "question": "What does fopen(\"example.txt\", \"r\") do?",
    "options": [
     "Opens 'example.txt' for reading",
     "Opens 'example.txt' for writing, erasing its existing contents",
     "Deletes the file 'example.txt'",
     "Always creates a brand-new empty file"
    ],
    "correctIndex": 0,
    "explanation": "The \"r\" mode opens an existing file for reading only.",
    "wrongExplanations": [
     "",
     "The \"w\" mode (not \"r\") opens for writing and truncates existing contents.",
     "fopen does not delete files; that would require a different function like remove().",
     "\"r\" mode expects the file to already exist; it returns NULL if it doesn't, rather than creating one."
    ]
   },
   {
    "question": "Which function is used to write a string to a file in C?",
    "options": [
     "fputs",
     "fgetc",
     "scanf",
     "clrscr"
    ],
    "correctIndex": 0,
    "explanation": "fputs writes a string to a file, e.g., fputs(\"Hello, World!\", file);",
    "wrongExplanations": [
     "",
     "fgetc reads a single character from a file; it doesn't write.",
     "scanf reads formatted input, it doesn't write to files.",
     "clrscr (from conio.h) clears the screen; it's unrelated to writing files."
    ]
   },
   {
    "question": "What should a program check immediately after calling fopen()?",
    "options": [
     "Whether the returned file pointer is NULL, indicating failure",
     "Whether the file has an odd number of bytes",
     "Whether the operating system is Windows",
     "Nothing — fopen never fails"
    ],
    "correctIndex": 0,
    "explanation": "fopen returns NULL if it fails to open the file (e.g., file not found), so checking for NULL before using the file pointer is essential.",
    "wrongExplanations": [
     "",
     "Byte count parity has nothing to do with whether the file opened successfully.",
     "fopen's success/failure doesn't depend on checking the OS type in code.",
     "fopen can fail for reasons like a missing file or permission issues, so checking is necessary."
    ]
   },
   {
    "question": "Which function can be used to report an I/O error with a descriptive message?",
    "options": [
     "perror()",
     "printf() alone, without any error-specific tool",
     "scanf()",
     "fclose()"
    ],
    "correctIndex": 0,
    "explanation": "perror() prints a descriptive error message corresponding to the last error that occurred, such as 'Error opening file'.",
    "wrongExplanations": [
     "",
     "printf() can display text, but it doesn't automatically describe the system error like perror() does.",
     "scanf() is for reading input, not reporting errors.",
     "fclose() closes a file; it doesn't report error descriptions."
    ]
   }
  ]
 },
 {
  "id": "quiz12",
  "subject": "c",
  "semester": "Semester 2",
  "title": "C Lecture 7 Quiz – Functions & Arrays",
  "description": "Function prototypes, scope, pass-by-value, and array declaration, indexing, and 2D arrays.",
  "questions": [
   {
    "question": "What is the benefit of a function described as 'Abstraction'?",
    "options": [
     "Hiding complex logic behind a simple name so users don't need to know how it works internally",
     "Making all code run faster automatically",
     "Converting data types automatically wherever needed",
     "Preventing all possible runtime errors"
    ],
    "correctIndex": 0,
    "explanation": "Abstraction lets users call a function by name without needing to understand its internal implementation details.",
    "wrongExplanations": [
     "",
     "Functions organize code but don't inherently guarantee faster execution.",
     "Functions don't perform automatic type conversion just by existing.",
     "Functions can still contain bugs; abstraction hides logic, it doesn't prevent errors."
    ]
   },
   {
    "question": "What must every function declaration (prototype) end with?",
    "options": [
     "A semicolon (;)",
     "An opening curly brace {",
     "A colon (:)",
     "Nothing at all"
    ],
    "correctIndex": 0,
    "explanation": "Unlike a full function definition, a prototype like 'int add(int a, int b);' must end with a semicolon.",
    "wrongExplanations": [
     "",
     "A curly brace begins a function's body/definition, not its prototype.",
     "Colons are not used to terminate C statements or prototypes.",
     "A prototype is a statement and requires a terminating semicolon."
    ]
   },
   {
    "question": "In C, how are arguments passed to a function by default?",
    "options": [
     "By value (the function receives copies)",
     "By reference (the function receives the original variables)",
     "By pointer only, automatically",
     "Randomly, depending on the compiler"
    ],
    "correctIndex": 0,
    "explanation": "C passes arguments by value, meaning the function works with copies; the caller's original variables are unaffected unless pointers are used.",
    "wrongExplanations": [
     "",
     "True pass-by-reference isn't C's default behavior; you must explicitly use pointers.",
     "Pointers must be passed explicitly by the programmer; it isn't automatic.",
     "Argument passing behavior is well-defined and consistent (pass by value), not random."
    ]
   },
   {
    "question": "To let a function modify the caller's original variable, what must be passed to it?",
    "options": [
     "A pointer (address) to the variable",
     "The variable's name written as a plain string",
     "Two copies of the variable",
     "Nothing — modification happens automatically"
    ],
    "correctIndex": 0,
    "explanation": "Since C passes arguments by value, you must pass a pointer to the variable so the function can dereference it and modify the original data.",
    "wrongExplanations": [
     "",
     "Passing a variable's name as a string wouldn't give the function access to the actual memory location.",
     "Passing copies keeps the original variable unaffected, which is the opposite of the goal here.",
     "Without an explicit pointer, changes inside the function stay local to its copy."
    ]
   },
   {
    "question": "Where are local variables, declared inside a function or block, visible?",
    "options": [
     "Only within that specific function or block",
     "Everywhere in the entire program",
     "Only in other source files",
     "Only inside loops, never in functions"
    ],
    "correctIndex": 0,
    "explanation": "Local variables are only visible and accessible within the function or block ({ }) in which they are declared.",
    "wrongExplanations": [
     "",
     "Global variables, not local ones, are visible throughout the whole program.",
     "Local variables aren't tied to other files; their scope is the enclosing block.",
     "Local variables can be declared inside any function or block, not just loops."
    ]
   },
   {
    "question": "Which keyword allows a local variable to retain its value between multiple function calls?",
    "options": [
     "static",
     "const",
     "extern",
     "typedef"
    ],
    "correctIndex": 0,
    "explanation": "A static local variable, like 'static int count = 0;', persists its value across separate calls to the function.",
    "wrongExplanations": [
     "",
     "const prevents a variable's value from changing, but doesn't control persistence across calls.",
     "extern declares a variable defined elsewhere, unrelated to persisting local state.",
     "typedef creates a type alias; it has nothing to do with variable persistence."
    ]
   },
   {
    "question": "Where are global variables defined, and what is their scope?",
    "options": [
     "Outside all functions; visible to the entire file",
     "Inside main() only; visible only there",
     "Only inside loops, with limited visibility",
     "Global variables cannot exist in C"
    ],
    "correctIndex": 0,
    "explanation": "Global variables are defined outside any function and are visible throughout the file, persisting for the program's lifetime.",
    "wrongExplanations": [
     "",
     "Variables declared inside main() only are local to main, not global.",
     "Loops don't define a variable's global/local scope by themselves.",
     "C fully supports global variables, defined outside function bodies."
    ]
   },
   {
    "question": "What return type should a function have if it does not return any value?",
    "options": [
     "void",
     "int",
     "null",
     "No return type is ever required"
    ],
    "correctIndex": 0,
    "explanation": "'void' is used as the return type for functions that don't return a value, e.g., void greet(void) { ... }",
    "wrongExplanations": [
     "",
     "'int' implies the function returns an integer value.",
     "'null' is not a valid C return type keyword.",
     "Every function must have a return type; void if nothing is returned."
    ]
   },
   {
    "question": "What is a common mistake that leads to 'infinite recursion'?",
    "options": [
     "Forgetting the base case that stops the recursive calls",
     "Declaring too many local variables in the function",
     "Using 'void' as the return type",
     "Adding too many comments to the code"
    ],
    "correctIndex": 0,
    "explanation": "Without a base case to stop it, a recursive function keeps calling itself indefinitely, eventually causing a stack overflow crash.",
    "wrongExplanations": [
     "",
     "The number of local variables doesn't cause infinite recursion by itself.",
     "The return type doesn't determine whether recursion terminates.",
     "Comments have no effect on program logic or execution."
    ]
   },
   {
    "question": "What is an array in C?",
    "options": [
     "A fixed-size collection of elements of the same data type stored in contiguous memory",
     "A function that can return multiple different values",
     "A single variable that can change its data type at runtime",
     "A special kind of loop"
    ],
    "correctIndex": 0,
    "explanation": "An array is a fixed-size, homogeneous collection of elements stored contiguously in memory, allowing instant (O(1)) access by index.",
    "wrongExplanations": [
     "",
     "C functions return a single value; arrays are data structures, not functions.",
     "Arrays require all elements to be the same fixed data type.",
     "Arrays are data structures, not a control structure like a loop."
    ]
   },
   {
    "question": "In C, what is the index of the first element of an array?",
    "options": [
     "0",
     "1",
     "-1",
     "It depends on the compiler used"
    ],
    "correctIndex": 0,
    "explanation": "C uses zero-based indexing, so the first element is always at index 0.",
    "wrongExplanations": [
     "",
     "Index 1 refers to the second element, not the first, in C's zero-based system.",
     "Negative indices are not the starting point of a standard C array.",
     "Zero-based indexing is a fixed rule of the C language, not compiler-dependent."
    ]
   },
   {
    "question": "For an array declared as int a[5], what is the valid index range?",
    "options": [
     "0 to 4",
     "1 to 5",
     "0 to 5",
     "-1 to 4"
    ],
    "correctIndex": 0,
    "explanation": "For an array of size N, valid indices range from 0 to N-1, so int a[5] has valid indices 0 through 4.",
    "wrongExplanations": [
     "",
     "Index 5 is out of bounds; C arrays are zero-indexed, so the last valid index is 4, not 5.",
     "Index 5 does not exist for a 5-element array; it's out of bounds.",
     "Negative indices like -1 are not valid access points for a standard array."
    ]
   },
   {
    "question": "What happens when you access an array element outside its valid bounds, such as a[10] for a 10-element array (valid indices 0-9)?",
    "options": [
     "Undefined behavior, such as a crash or corrupted data",
     "Python-style negative wraparound indexing",
     "A guaranteed, always-identical compiler error message",
     "The array automatically resizes to fit"
    ],
    "correctIndex": 0,
    "explanation": "C does not perform automatic bounds checking, so accessing an out-of-range index like a[10] leads to undefined behavior — it might crash, corrupt memory, or silently return garbage.",
    "wrongExplanations": [
     "",
     "C arrays don't support Python-style negative index wraparound.",
     "C does not catch out-of-bounds access at compile time; it's a runtime issue with no guaranteed message.",
     "C arrays are fixed size; they never resize themselves automatically."
    ]
   },
   {
    "question": "How do you access a specific element in a 2D array declared as int matrix[3][4]?",
    "options": [
     "Using two indices, like matrix[row][col]",
     "Using a single index only, like matrix[5]",
     "Using dot notation, like matrix.row.col",
     "2D arrays cannot be accessed directly in C"
    ],
    "correctIndex": 0,
    "explanation": "A 2D array is accessed using two indices in square brackets: array[row][col], e.g., matrix[0][0] is the top-left element.",
    "wrongExplanations": [
     "",
     "A single index isn't enough to specify both the row and column of a 2D array.",
     "Dot notation is used for structures/objects in other languages, not for indexing C arrays.",
     "2D arrays are fully supported and accessed directly using the [row][col] syntax."
    ]
   }
  ]
 },
 {
  "id": "quiz13",
  "subject": "c",
  "semester": "Semester 2",
  "title": "C Coding Challenge – Trace the Code",
  "description": "Read real C code snippets and predict the output, spot the bug, or explain the behavior using concepts from all seven lectures.",
  "questions": [
   {
    "question": "What does this code print?\nint x = 5, y = 2;\nprintf(\"%d\", x / y);",
    "options": [
     "2",
     "2.5",
     "3",
     "0"
    ],
    "correctIndex": 0,
    "explanation": "Both x and y are int, so C performs integer division, which truncates the decimal part: 5 / 2 = 2.",
    "wrongExplanations": [
     "",
     "2.5 would only print if at least one operand were a float/double and %f were used.",
     "Integer division truncates toward zero rather than rounding up, so it does not give 3.",
     "5 divided by 2 does not equal 0; only 0 / 5 or similar would produce 0."
    ]
   },
   {
    "question": "What does this code print?\nint a = 10;\nif (a > 5)\n    printf(\"A\");\nelse\n    printf(\"B\");\nprintf(\"C\");",
    "options": [
     "AC",
     "ABC",
     "A",
     "BC"
    ],
    "correctIndex": 0,
    "explanation": "Without braces, only the single statement right after 'if' or 'else' belongs to that branch. Since a > 5 is true, \"A\" prints, then \"C\" prints unconditionally afterward, giving \"AC\".",
    "wrongExplanations": [
     "",
     "Only one branch of the if-else executes, not both A and B.",
     "The final printf(\"C\") is not part of the if-else, so it still executes after A.",
     "Since a > 5 is true, the 'if' branch (A) runs, not the 'else' branch (B)."
    ]
   },
   {
    "question": "What does this loop print?\nfor (int i = 0; i < 3; i++) {\n    printf(\"%d \", i);\n}",
    "options": [
     "0 1 2 ",
     "1 2 3 ",
     "0 1 2 3 ",
     "3 2 1 "
    ],
    "correctIndex": 0,
    "explanation": "i starts at 0 and the loop runs while i < 3, printing 0, 1, and 2 before stopping when i becomes 3.",
    "wrongExplanations": [
     "",
     "The loop starts at i = 0, not i = 1, so 1 2 3 is incorrect.",
     "The condition i < 3 stops the loop before i reaches 3, so 3 is never printed.",
     "The for loop counts upward here, not downward, since i++ increases i each iteration."
    ]
   },
   {
    "question": "What does this switch statement print?\nint n = 2;\nswitch(n) {\n    case 1: printf(\"one\");\n    case 2: printf(\"two\");\n    case 3: printf(\"three\"); break;\n    default: printf(\"other\");\n}",
    "options": [
     "twothree",
     "two",
     "onetwothree",
     "other"
    ],
    "correctIndex": 0,
    "explanation": "n matches case 2, so execution starts at \"two\". Since case 2 has no break, it falls through into case 3, printing \"three\" as well, then hits break and stops — giving \"twothree\".",
    "wrongExplanations": [
     "",
     "Without a break after case 2, execution falls through into case 3, so \"three\" also prints.",
     "case 1 does not match n (which is 2), so \"one\" is never printed.",
     "default only runs when no case matches; here case 2 matches, so default is skipped."
    ]
   },
   {
    "question": "What does this program print?\nvoid addOne(int x) {\n    x = x + 1;\n}\nint main(void) {\n    int num = 5;\n    addOne(num);\n    printf(\"%d\", num);\n}",
    "options": [
     "5",
     "6",
     "0",
     "This causes a compile error"
    ],
    "correctIndex": 0,
    "explanation": "C passes arguments by value, so addOne receives a copy of num. Modifying x inside the function does not affect the original num in main, which remains 5.",
    "wrongExplanations": [
     "",
     "6 would only print if addOne modified num directly, which requires passing a pointer.",
     "num is never set to 0 anywhere in this code.",
     "This code is valid C; passing an int by value to a void function compiles fine."
    ]
   },
   {
    "question": "What does this code print?\nint arr[5] = {1, 2, 3, 4, 5};\nfor (int i = 0; i < 5; i++) {\n    arr[i] = arr[i] * 2;\n}\nprintf(\"%d\", arr[3]);",
    "options": [
     "8",
     "4",
     "10",
     "6"
    ],
    "correctIndex": 0,
    "explanation": "arr[3] starts as 4 (zero-based indexing: arr[0]=1, arr[1]=2, arr[2]=3, arr[3]=4). The loop doubles every element, so arr[3] becomes 4 * 2 = 8.",
    "wrongExplanations": [
     "",
     "4 is the original value of arr[3] before the loop doubles it.",
     "10 would be arr[4] (original value 5) doubled, not arr[3].",
     "6 would be arr[2] (original value 3) doubled, not arr[3]."
    ]
   },
   {
    "question": "What does this code print?\nint i = 0;\nwhile (1) {\n    if (i == 3) break;\n    printf(\"%d\", i);\n    i++;\n}",
    "options": [
     "012",
     "0123",
     "123",
     "It loops forever and never stops"
    ],
    "correctIndex": 0,
    "explanation": "while(1) is an infinite loop, but the break statement exits it once i reaches 3. So i prints as 0, 1, 2, then breaks before printing 3, giving \"012\".",
    "wrongExplanations": [
     "",
     "The break happens as soon as i == 3, before printf(\"%d\", i) runs for i = 3, so 3 is never printed.",
     "0 is printed first, since i starts at 0 and the printf runs before the increment.",
     "The break statement is exactly what stops this otherwise infinite loop."
    ]
   },
   {
    "question": "What does this code print?\nint x = 10;\ndo {\n    printf(\"Hi \");\n} while (x < 5);",
    "options": [
     "Hi (printed once)",
     "Nothing is printed",
     "It loops forever, printing Hi repeatedly",
     "This causes a compile error"
    ],
    "correctIndex": 0,
    "explanation": "A do-while loop always executes its body at least once before checking the condition. So \"Hi \" prints first, and only then is x < 5 checked — which is false (10 is not < 5), so the loop stops after one iteration.",
    "wrongExplanations": [
     "",
     "Unlike a while loop, do-while guarantees the body runs once regardless of the condition.",
     "The condition x < 5 is false, so the loop does not repeat after the first execution.",
     "This is valid, standard C syntax and compiles without error."
    ]
   },
   {
    "question": "What does this nested loop print?\nfor (int i = 1; i <= 2; i++) {\n    for (int j = 1; j <= 2; j++) {\n        printf(\"%d\", i * j);\n    }\n}",
    "options": [
     "1224",
     "1234",
     "1122",
     "2244"
    ],
    "correctIndex": 0,
    "explanation": "The inner loop runs fully for each outer iteration: i=1,j=1 -> 1; i=1,j=2 -> 2; i=2,j=1 -> 2; i=2,j=2 -> 4. Concatenated, that's \"1224\".",
    "wrongExplanations": [
     "",
     "The values printed are products (i*j), not simple counting 1,2,3,4.",
     "The second and third results are both 2 (1*2 and 2*1), not repeated 1s and 2s in that order.",
     "The first result is 1*1=1, not 2, so 2244 is incorrect."
    ]
   },
   {
    "question": "What does this program print?\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\nint main(void) {\n    printf(\"%d\", factorial(4));\n}",
    "options": [
     "24",
     "12",
     "4",
     "1"
    ],
    "correctIndex": 0,
    "explanation": "factorial(4) = 4 * factorial(3) = 4 * 3 * factorial(2) = 4 * 3 * 2 * factorial(1) = 4 * 3 * 2 * 1 = 24.",
    "wrongExplanations": [
     "",
     "12 would be 4 * 3, stopping the recursion too early.",
     "4 is just the input value n, not its factorial.",
     "1 is only the base case's return value, not the final accumulated result."
    ]
   },
   {
    "question": "What is the problem with this code?\ndouble price = 9.5;\nprintf(\"%d\", price);",
    "options": [
     "The format specifier %d doesn't match the double argument, producing incorrect/undefined output",
     "It correctly prints 9",
     "It correctly prints 9.5",
     "This causes a compile-time error"
    ],
    "correctIndex": 0,
    "explanation": "printf's format specifier must match the argument's type. %d expects an int, but price is a double, so the output is incorrect or undefined — the correct specifier would be %f or %lf.",
    "wrongExplanations": [
     "",
     "printf does not automatically truncate a double to match %d; the mismatch produces garbage output, not a clean 9.",
     "%d cannot correctly display a double's fractional part like .5.",
     "This mismatch is typically not caught by the compiler (especially with older compilers/settings) and instead causes a runtime formatting problem."
    ]
   },
   {
    "question": "What does this program print?\nvoid counter(void) {\n    static int count = 0;\n    count++;\n    printf(\"%d \", count);\n}\nint main(void) {\n    counter();\n    counter();\n    counter();\n}",
    "options": [
     "1 2 3 ",
     "1 1 1 ",
     "0 1 2 ",
     "3 3 3 "
    ],
    "correctIndex": 0,
    "explanation": "static int count retains its value between calls instead of resetting. Each call increments it from its last value: 1, then 2, then 3.",
    "wrongExplanations": [
     "",
     "Without 'static', count would reset to 0 each call and always print 1; but since it is static, it keeps incrementing.",
     "count starts at 0 but is incremented before printing, so the first print is 1, not 0.",
     "static variables retain and accumulate their value across calls; they don't jump straight to the final value on every call."
    ]
   },
   {
    "question": "What does this program print?\nint x = 100;\nvoid show(void) {\n    int x = 5;\n    printf(\"%d\", x);\n}\nint main(void) {\n    show();\n}",
    "options": [
     "5",
     "100",
     "105",
     "This causes a compile error"
    ],
    "correctIndex": 0,
    "explanation": "The local variable x inside show() shadows the global x. Inside the function, printf refers to the local x (5), not the global one (100).",
    "wrongExplanations": [
     "",
     "100 is the global x's value, but it's hidden (shadowed) by the local x within show().",
     "105 would only occur if the two x variables were added together, which they are not.",
     "Shadowing a global variable's name with a local variable of the same name is legal C."
    ]
   },
   {
    "question": "What is wrong with this code?\nint arr[5] = {1, 2, 3, 4, 5};\nfor (int i = 0; i <= 5; i++) {\n    printf(\"%d \", arr[i]);\n}",
    "options": [
     "The loop condition should be i < 5; using i <= 5 accesses arr[5], which is out of bounds",
     "The array is declared with the wrong syntax",
     "Nothing is wrong; this code is completely correct",
     "printf cannot be used inside a for loop"
    ],
    "correctIndex": 0,
    "explanation": "For a 5-element array, valid indices are 0 to 4. The condition i <= 5 lets i reach 5, so arr[5] is accessed — an out-of-bounds read that causes undefined behavior (a classic off-by-one bug).",
    "wrongExplanations": [
     "",
     "int arr[5] = {1, 2, 3, 4, 5}; is valid, correct array declaration and initialization syntax.",
     "The off-by-one loop condition causes an out-of-bounds array access, so this code is not correct.",
     "printf is commonly and safely used inside loops; that is not the bug here."
    ]
   }
  ]
 }
]);
