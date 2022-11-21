function viewImage(event){
    document.getElementById('imgView').src=
    URL.createObjectURL(event.target.files[0])
}