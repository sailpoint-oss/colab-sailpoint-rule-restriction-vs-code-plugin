// Import the necessary modules from vscode
import * as vscode from 'vscode';

// Define the flagged keywords
const flaggedKeywords = [
    'context',
    '.prepare()',
    '.getJdbcConnection()',
    '.getConnection()',
    '.isClosed()',
    '.setUserName()',
    '.getUserName()',
    '.impersonate()',
    '.setScopeResults()',
    '.getScopeResults()',
    '.getConfiguration()',
    '.encrypt()',
    '.decrypt()',
    '.authenticate()',
    '.sendEmailNotification()',
    '.runRule()',
    '.runScript()',
    '.startTransaction()',
    '.commitTransaction()',
    '.rollbackTransaction()',
    '.getObjectById()',
    '.getObjectByName()',
    '.getObject()',
    '.lockObjectById()',
    '.lockObjectByName()',
    '.lockObject()',
    '.unlockObject()',
    '.getUniqueObject()',
    '.getObjects()',
    '.search()',
    '.update()',
    '.countObjects()',
    '.removeObjects()',
    '.attach()',
    '.decache()',
    '.clearHighLevelCache()',
    '.getReferencedObject()',
    '.enableStatistics()',
    '.printStatistics()',
    '.reconnect()',
    '.setPersistenceOptions()',
    '.getPersistenceOptions()',
    '.setProperty()',
    '.importObject()',
    '.notify()',
    '.notifyAll()',
    '.reconnect()',
    '.removeObject()',
    'SailpointFactory',
    '.toXml()',
    'System.out.',
    'System.err.',
    'Runnable',
    'Thread',
    'public static',
    '.printStackTrace',
    'XMLObjectFactory',
    'Log4j',
    'Logger.getLogger​'
];



const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.3)', // Red color with some transparency
});

function provideDocumentHighlights(document: vscode.TextDocument, flaggedKeyword: string): vscode.DocumentHighlight[] {
    const highlights: vscode.DocumentHighlight[] = [];

    const keywordRegex = new RegExp(`\\b${flaggedKeyword}\\b`, 'gi');

    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const line = document.lineAt(lineIndex);
        let match;

        while ((match = keywordRegex.exec(line.text)) !== null) {
            const startPos = new vscode.Position(lineIndex, match.index);
            const endPos = new vscode.Position(lineIndex, match.index + flaggedKeyword.length);
            const range = new vscode.Range(startPos, endPos);
            const highlight = new vscode.DocumentHighlight(range, vscode.DocumentHighlightKind.Read); // Use a suitable highlight kind
            highlights.push(highlight);
        }
    }

    return highlights;
}

// Register a document symbol and highlight provider for multiple languages
['plaintext', 'java', 'beanshell'].forEach(language => {
    vscode.languages.registerDocumentSymbolProvider({ language }, {
        provideDocumentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
            const symbols: vscode.SymbolInformation[] = [];

            for (const keyword of flaggedKeywords) {
                symbols.push(new vscode.SymbolInformation(keyword, vscode.SymbolKind.String, '', new vscode.Location(document.uri, new vscode.Position(0, 0))));
            }

            return symbols;
        }
    });

    vscode.languages.registerDocumentHighlightProvider({ language }, {
        provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position): vscode.DocumentHighlight[] {
            const highlights: vscode.DocumentHighlight[] = [];

            for (const keyword of flaggedKeywords) {
                highlights.push(...provideDocumentHighlights(document, keyword));
            }

            return highlights;
        }
    });
});

// Register a hover provider for multiple languages
['plaintext', 'java', 'beanshell'].forEach(language => {
    vscode.languages.registerHoverProvider({ language }, {
        provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
            const wordRange = document.getWordRangeAtPosition(position);

            if (!wordRange) {
                return null;
            }

            const hoveredWord = document.getText(wordRange);
            if (flaggedKeywords.includes(hoveredWord)) {
                return new vscode.Hover(`Keyword "${hoveredWord}" is disallowed in SailPoint IdenitityNow Rules.`, wordRange);
            }

            return null;
        }
    });
});

// Subscribe to the onDidChangeTextDocument event to trigger disallowed keyword notifications and update decorations
vscode.workspace.onDidChangeTextDocument(event => {
    const document = event.document;
    const changedText = event.contentChanges[0].text;

    flaggedKeywords.forEach(keyword => {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (keywordRegex.test(changedText)) {
            // Show a notification for the disallowed keyword
            vscode.window.showInformationMessage(`Keyword "${keyword}" is disallowed in SailPoint IdenitityNow Rules.`);
        }
    });

    // Update decorations on text change
    updateDecorations(document);
});

// Update decorations on activation
vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
        updateDecorations(editor.document);
    }
});

// Extension activation event
export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activated.');
    context.subscriptions.push(vscode.languages.registerHoverProvider({ language: 'plaintext' }, {
        provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
            return null;
        }
    }));

    // Additional subscriptions can be pushed into the context.subscriptions array
    context.subscriptions.push(
        // Example: vscode.commands.registerCommand('extension.sayHello', () => {
        //     vscode.window.showInformationMessage('Hello, World!');
        // })
    );
}

// Extension deactivation event
export function deactivate() {
    console.log('Extension deactivated.');
}

function updateDecorations(document: vscode.TextDocument) {
    if (!document || !vscode.window.activeTextEditor || document.languageId === 'plaintext') {
        return;
    }

    const decorations: vscode.DecorationOptions[] = [];
    flaggedKeywords.forEach(keyword => {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
        let match;

        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex);
            while ((match = keywordRegex.exec(line.text)) !== null) {
                const startPos = new vscode.Position(lineIndex, match.index);
                const endPos = new vscode.Position(lineIndex, match.index + keyword.length);
                const range = new vscode.Range(startPos, endPos);
                decorations.push({ range });
            }
        }
    });

    vscode.window.activeTextEditor.setDecorations(decorationType, decorations);
}
