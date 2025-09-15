"""Hello World Function Implementation"""
import datetime

def run(input_data):
    """Multi-language hello world function that greets the user"""
    name = input_data.get("name", "World")
    language = input_data.get("language", "English")
    
    greeting = ""
    if language == "Spanish":
        greeting = f"¡Hola, {name}!"
    elif language == "French":
        greeting = f"Bonjour, {name}!"
    else:
        greeting = f"Hello, {name}!"
    
    return {
        "message": greeting,
        "timestamp": datetime.datetime.now().isoformat(),
        "language": language
    }
