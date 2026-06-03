import os, shutil

# Nuke everything under app/compare except page.tsx and [slug]
compare_dir = r'app/compare'
keep = {'page.tsx', '[slug]'}

for item in os.listdir(compare_dir):
    if item not in keep:
        full = os.path.join(compare_dir, item)
        if os.path.isdir(full):
            shutil.rmtree(full)
            print(f"DELETED dir: {item}")
        elif os.path.isfile(full) and item != 'page.tsx':
            os.remove(full)
            print(f"DELETED file: {item}")
        else:
            print(f"KEPT: {item}")

print("Done - only page.tsx and [slug] remain")
print("Contents:", os.listdir(compare_dir))
