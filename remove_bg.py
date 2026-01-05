from PIL import Image

def remove_green_background(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Check for green-ish pixels. 
        # The prompt asked for #00FF00, but let's be slightly tolerant or exact.
        # Exact: (0, 255, 0)
        if item[0] < 50 and item[1] > 200 and item[2] < 50:
            new_data.append((255, 255, 255, 0)) # Transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

# Run on the current sprite
try:
    remove_green_background("client/public/sprites/character.png", "client/public/sprites/character.png")
except Exception as e:
    print(f"Error: {e}")
