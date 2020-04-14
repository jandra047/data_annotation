$(document).ready(function(){
	// Activate tooltip
	$('[data-toggle="tooltip"]').tooltip();
	

	$("#delete_project").on("show.bs.modal", function(event){
		// Get the button that triggered the modal
		var button = $(event.relatedTarget);

		// Extract value from the custom data-* attribute
		var titleData = button.data("title");
		$("#deleteForm").attr("action", "/delete/" + titleData);
	});

	$("#add_user").on("show.bs.modal", function(event){
		// Get the button that triggered the modal
		var button = $(event.relatedTarget);

		// Extract value from the custom data-* attribute
		var titleData = button.data("title");
		$("#addUserForm").attr("action", "/add_user/" + titleData);
	});


	$('.accordion-toggle').click(function(){
		target = $(this).attr('data-target');
		$(target).toggle()
		$(this).toggleClass('fa-plus fa-minus')
	});

	document.querySelectorAll('.user-remove').forEach(item => {
		item.addEventListener('click', event => {
			var username = $(item).parent().prev().prev().html()
			var project_name = $(item).attr('data-project')
			console.log(username, project_name)
			$.ajax({
				type: 'POST',
				url: "/remove_user/" + project_name, 
				data: {
					project_name: project_name,
					username: username
				},
				success: function (response) {
					window.location.href = '/'
				}
			})
		})
	})

	$('[data-toggle="tab"]').click(function(e) {
	    var $this = $(this)
		loadurl = $this.attr('href')
		console.log(loadurl)
	});

});