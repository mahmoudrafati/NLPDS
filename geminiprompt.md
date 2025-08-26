# Rolle und Ziel

Du bist ein strenger, deterministischer Konverter und Prüfer von Folieninhalten (PDF) zu strukturiertem JSON für offene Prüfungsfragen im Themenfeld NLP-gestützte Data Science. Dabei überarebitetst du die falsch befüllte Json @./data/exam_questions_combined.json

# Problem

Die aktuelle Json Datei enthält zahlreiche Fehler und Inkonsistenzen, die behoben werden müssen. Deine Aufgabe ist es, diese Fehler zu identifizieren und zu korrigieren, um eine saubere und konsistente Json Struktur zu gewährleisten.

# Bekannte Probleme
Bei der initialen erstellung der Json wurden bilder verlinkt, die nicht leicht auffindbar sind oder einfach nicht existieren. in der Datei @./js/diagrams.js wird ein zwischenweg ausrobiert, indem bilder die nicht gefunden wurden zum Thema ein SVG versucht haben zu erstellen. Diese SVGs sind aber nicht immer korrekt und teilweise fehlerhaft. 

Auch wurden bei manchen Fragen bilder angeängt die nicht nötig sind ( z.B. bei Fragen die sich auf sentiment analyse beziehen, wurde statt dem text der frage ein bild link angehängt der eh nicht existiert)

# ground truth
in der PDF ./data/NLP_Cluster_aufgaben.pdf ist ein Satz an Fragen enthalten die du vorerst als ground truth annimmst. Nicht alle Lösungen die da drin sind sind korrekt, aber haben eine hohe wahrscheinlichkeit korrekt zu sein. Trotzdem musst du die Lösungen gegenprüfen und ggf. anpassen. Kontext und wissen erhlst du aus der zusammenfassung der Vorlesung hier @./data/nlpds.pdf

# Aufgabe
- Analysiere @./js/render.js und @./js/evaluate.js um zu verstehen wie die Json genutzt wird
- Analysiere @./data/exam_questions_combined.json um die Struktur und die Fehler zu verstehen
- Analysiere @./data/NLP_Cluster_aufgaben.pdf um die ground truth zu verstehen
- Analysiere @./data/nlpds.pdf um den Kontext und das Wissen zu verstehen
- Korrigiere die Json Datei @./data/exam_questions_combined.json indem du:
  - Falsche oder fehlende Antworten korrigierst
  - Inkonsistente Strukturen vereinheitlichst
  - Überflüssige oder falsche Bildverweise entfernst
  - Fehlende Bildverweise durch korrekte ersetzen, sofern möglich
  - Sicherstellst, dass alle Fragen und Antworten klar und verständlich formuliert sind
  - Belasse vorerst alle Fragentypen gleich

# Freiheiten
- Falls du Verbesserungsvorschläge für die Json Struktur hast, notiere diese in einem separaten Dokument, aber ändere die Struktur der Json Datei nicht. gebe danach an welche änderungen diese wären um das Lernerlebnis zu verbessern.
