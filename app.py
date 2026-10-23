from flask import Flask, render_template, request, jsonify
import os
from main import store_files_only_Neo4j, lang_map, Extract_only_file, driver

app = Flask(__name__)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/go_through_all', methods=['POST'])
def go_through_all():
    project_name = request.form.get('project', 'default')
    files = request.files.getlist('files')
    paths = request.form.getlist('paths')

    if not files:
        return jsonify({'error': 'no files received'}), 400

    processed, failed = [], []

    for f, rel_path in zip(files, paths):
        # Strip the top-level folder prefix (e.g. "MyProject/src/a.py" → "src/a.py")
        rel_path = rel_path.split('/', 1)[1] if '/' in rel_path else rel_path
        try:
            ext = os.path.splitext(rel_path)[1].lower()
            language = lang_map.get(ext, 'Unknown')
            code = f.read().decode('utf-8', errors='replace')
            result = Extract_only_file(code, language, rel_path)
            if result:
                store_files_only_Neo4j(result, project=project_name)
            processed.append(rel_path)
        except Exception as e:
            print(f"Failed: {rel_path} — {e}")
            failed.append({'file': rel_path, 'error': str(e)})

    return jsonify({
        'project': project_name,
        'processed': len(processed),
        'failed': len(failed),
        'failed_files': failed
    })


@app.route('/graph')
def graph_page():
    return render_template('graph.html')


@app.route('/graph_data')
def graph_data():
    project = request.args.get('project', '')
    file = request.args.get('file', '')

    with driver.session() as session:
        # Fetch the selected file + all files it depends on (up to 5 hops deep)
        rows = session.run("""
            MATCH path = (a:File {project: $p, name: $f})-[:IMPORTS_LOCAL*0..5]->(b:File)
            RETURN a.name AS source, b.name AS target
        """, p=project, f=file).data()

        # Also fetch files that import the selected file (reverse direction, 1 hop)
        reverse_rows = session.run("""
            MATCH (x:File {project: $p})-[:IMPORTS_LOCAL]->(a:File {project: $p, name: $f})
            RETURN x.name AS source, a.name AS target
        """, p=project, f=file).data()

    all_rows = rows + reverse_rows
    nodes, edges = {}, []

    for r in all_rows:
        src = r['source']
        tgt = r['target']

        if src not in nodes:
            is_root = (src == file)
            nodes[src] = {
                'id': src,
                'label': src.split('/')[-1],
                'title': src,
                'color': '#ef4444' if is_root else '#3b82f6',
                'size': 22 if is_root else 16,
                'font': {'size': 14}
            }

        if tgt and tgt not in nodes and tgt != src:
            nodes[tgt] = {
                'id': tgt,
                'label': tgt.split('/')[-1],
                'title': tgt,
                'color': '#10b981',
                'size': 14,
                'font': {'size': 13}
            }

        if tgt and tgt != src:
            edges.append({
                'from': src,
                'to': tgt,
                'arrows': 'to',
                'color': {'color': '#94a3b8'}
            })

    return jsonify(nodes=list(nodes.values()), edges=edges)


if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)