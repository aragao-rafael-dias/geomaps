from flask import Flask, Blueprint

def create_app():
    app = Flask(__name__)

    from app.routes import rt_index, rt_calcular
    app.register_blueprint(rt_index.bp)
    app.register_blueprint(rt_calcular.bp)

    return app