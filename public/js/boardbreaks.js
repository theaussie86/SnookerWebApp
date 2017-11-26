$(function(){
    $('.deleteBreak').on('click',function(){
        var $row = $(this).closest('tr').children();
        
        var datum= $row[0].textContent;
        var player= $row[1].textContent;
        var serie= $row[2].textContent;

        $.ajax({
            type: 'GET',
            url: '/board/delete/'+datum+'/'+player+'/'+serie,
            success: function(serie){
                location.reload();
            }
        });
    });
});