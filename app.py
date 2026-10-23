from flask import Flask, render_template, jsonify
from flask import Flask, render_template, request, jsonify
import os
from main import PROCESS_FILES_only_mini,store_files_only_Neo4j,lang_map,Extract_only_file,driver
app=Flask(__name__)

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
        rel_path = rel_path.split('/', 1)[1] if '/' in rel_path else rel_path
        try:
            ext = os.path.splitext(rel_path)[1].lower()
            language = lang_map.get(ext, 'Unknown')
            code = f.read().decode('utf-8')
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
    project = request.args.get('project')
    file = request.args.get('file')
    with driver.session() as session:
        rows = session.run("""
            MATCH (a:File {project: $p, name: $f})
            OPTIONAL MATCH (a)-[:IMPORTS_LOCAL]->(b:File)
            RETURN a.name AS source, b.name AS target
        """, p=project, f=file).data()

    nodes, edges = {}, []
    for r in rows:
        nodes[r['source']] = {'id': r['source'], 'label': r['source'].split('/')[-1],
                              'title': r['source'], 'color': '#ef4444', 'size': 22}
        if r['target']:
            nodes[r['target']] = {'id': r['target'], 'label': r['target'].split('/')[-1],
                                  'title': r['target']}
            edges.append({'from': r['source'], 'to': r['target']})
    return jsonify(nodes=list(nodes.values()), edges=edges)
if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)