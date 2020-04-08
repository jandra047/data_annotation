$(document).ready(function(){
	// Activate tooltip
	$('[data-toggle="tooltip"]').tooltip();
	
	// Select/Deselect checkboxes
	var checkbox = $('table tbody input[type="checkbox"]');
	$("#selectAll").click(function(){
		if(this.checked){
			checkbox.each(function(){
				this.checked = true;                        
			});
		} else{
			checkbox.each(function(){
				this.checked = false;                        
			});
		} 
	});
	checkbox.click(function(){
		if(!this.checked){
			$("#selectAll").prop("checked", false);
		}
	});
	$("#delete_project").on("show.bs.modal", function(event){
		// Get the button that triggered the modal
		var button = $(event.relatedTarget);

		// Extract value from the custom data-* attribute
		var titleData = button.data("title");
		$("#deleteForm").attr("action", "/delete/" + titleData);
	});
});