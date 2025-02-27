from flask import render_template, Blueprint

bp = Blueprint('rt_index', __name__)

@bp.route("/")
def index():
    return render_template("index.html")