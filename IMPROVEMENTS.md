# Vorschläge zur Verbesserung der JSON-Struktur

Dieses Dokument enthält Vorschläge zur Verbesserung der Struktur der `exam_questions_combined.json`-Datei, um die Robustheit, Erweiterbarkeit und das Lernerlebnis der Anwendung zu verbessern.

### 1. Konsistente und erweiterte Typisierung

**Problem:** Das aktuelle `type`-Feld vermischt das Frageformat (z.B. `rechenaufgabe`) mit dem UI-Typ (z.B. `mc_radio`).

**Vorschlag:** Trennung in zwei Felder:
- `question_format`: Beschreibt die Art der Frage (z.B. `calculation`, `definition`, `comprehension`, `skip_gram_identification`).
- `answer_type`: Definiert das erwartete Antwortformat und steuert das UI (z.B. `free_text`, `multiple_choice_single`, `multiple_choice_multiple`, `numerical_input`).

**Beispiel:**
```json
"question_format": "calculation",
"answer_type": "numerical_input",
```

### 2. Strukturierte Antworten für Rechen- und Zählaufgaben

**Problem:** Bei `rechenaufgabe` ist die `given_answer` ein formatierter String, der manuell geparst werden muss, was fehleranfällig ist.

**Vorschlag:** Ein strukturiertes Objekt für die Antworten verwenden.

**Beispiel (für Q11):**
```json
"given_answer": {
  "token": 13,
  "word_forms": 9,
  "syntactic_words": 11,
  "lexemes": 6,
  "lexem_groups": 4
}
```
Dies würde eine exakte automatische Auswertung ermöglichen.

### 3. Atomare Fragen

**Problem:** Einige Einträge (z.B. `Q17`) bündeln mehrere unabhängige Teilfragen in einem einzigen JSON-Objekt.

**Vorschlag:** Jede Frage sollte atomar sein. `Q17` sollte in zwei separate Frage-Objekte aufgeteilt werden. Dies ermöglicht eine granulare Auswertung, besseres Mischen von Fragen und eine gezieltere Analyse des Lernfortschritts.

### 4. Verbessertes Material-Handling (Bilder & Formeln)

**Problem:** Das `images`-Feld ist eine einfache Liste von Strings, die nicht zwischen echten Bildern und Platzhaltern unterscheidet.

**Vorschlag:** Ein `materials`-Array mit Objekten, die Typ und Inhalt beschreiben.

**Beispiel:**
```json
"materials": [
  {
    "type": "image",
    "path": "assets/questions/q13_skip_gram_formula.png",
    "description": "Formel zur Berechnung von Skip-Grammen mit exakt k Skips."
  },
  {
    "type": "svg_stub",
    "kind": "transformer",
    "description": "Vereinfachtes Diagramm der Transformer-Architektur."
  }
]
```
Dies würde dem Frontend ermöglichen, intelligentere Fallbacks zu implementieren und z.B. Alt-Texte für Barrierefreiheit bereitzustellen.

### 5. Explizite Punkte und Schwierigkeitsgrad

**Problem:** Die Punktzahl einer Frage ist oft nur im `question_text` erwähnt.

**Vorschlag:** Dedizierte Felder für Metadaten hinzufügen.
- `points`: (Integer) Die für die Frage erreichbare Punktzahl.
- `difficulty`: (String) Eine Einschätzung des Schwierigkeitsgrads (z.B. `leicht`, `mittel`, `schwer`).

### 6. Explizite Multiple-Choice-Optionen

**Problem:** Die MC-Optionen sind nur Text-Strings; die Buchstaben (A, B, C) werden von der UI hinzugefügt. Dies koppelt die Daten eng an die Darstellung.

**Vorschlag:** Die Optionen als Objekte mit Label und Text definieren.

**Beispiel:**
```json
"options": [
  { "label": "A", "text": "Wörter werden durch Buchstaben n-Gramme repräsentiert..." },
  { "label": "B", "text": "Wörter werden durch Buchstaben n-Gramme repräsentiert..." }
],
"correct_options": ["A"]
```
Dies macht die `correct_options` eindeutig und die Datenstruktur in sich geschlossen.
